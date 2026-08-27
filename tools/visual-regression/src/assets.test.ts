import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  assetCacheDir,
  cachePath,
  forgetErrorResponses,
  forgetUnreachable,
  installAssetCache,
  stubFor,
  type AssetCache,
} from './assets'
import { freezeSvg } from './freeze'

import type { BrowserContext, Route } from 'playwright'

const PNG = 'https://cdn.sanity.io/images/p/d/abc-1200x297.png?w=456'

/** A warm asset cache, written the way a finished run leaves one. */
function warmCache(entries: Array<{ url: string; status: number }>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vr-assets-'))
  for (const { url, status } of entries) {
    const file = cachePath(dir, url)
    fs.writeFileSync(file, Buffer.from('bytes'))
    fs.writeFileSync(`${file}.json`, JSON.stringify({ url, status, contentType: 'image/png' }))
  }
  return dir
}

const isCached = (dir: string, url: string) => fs.existsSync(`${cachePath(dir, url)}.json`)

describe('assetCacheDir', () => {
  it('lives outside the checkout, so a reaped worktree does not take it', () => {
    expect(assetCacheDir({}, '/Users/x')).toBe('/Users/x/.o3-sanity/vr-assets')
  })

  it('answers to O3_VR_ASSET_DIR', () => {
    expect(assetCacheDir({ O3_VR_ASSET_DIR: '/tmp/vr' }, '/Users/x')).toBe('/tmp/vr')
  })
})

describe('cachePath', () => {
  it('separates two transforms of one asset', () => {
    // The trap it exists for: a Sanity CDN URL names the asset in the path and
    // the size in the query, so keying on the path alone would serve the
    // homepage's 456px logo to the page that asked for 1200px.
    const asset = 'https://cdn.sanity.io/images/p/d/abc-1200x297.png'
    expect(cachePath('/assets', `${asset}?w=456`)).not.toBe(cachePath('/assets', `${asset}?w=1200`))
  })

  it('is stable, because that is the whole point of a cache', () => {
    const url = 'https://cdn.sanity.io/images/p/d/abc-1200x297.png?w=456'
    expect(cachePath('/assets', url)).toBe(cachePath('/assets', url))
  })
})

describe('stubFor', () => {
  it('gives a third-party player an empty document rather than a player', () => {
    expect(stubFor('document').body).not.toContain('script')
    expect(stubFor('script').body).toBe('')
  })
})

describe('forgetErrorResponses', () => {
  it('forgets a 403, so a fix upstream needs no flag to be noticed', () => {
    // The trap it exists for (#236): a run that hit a broken CDN URL wrote the
    // 403 to disk, and every run after it replayed that 403 — after the URL was
    // fixed, after the asset was reuploaded, forever.
    const dir = warmCache([{ url: PNG, status: 403 }])
    forgetErrorResponses(dir)
    expect(isCached(dir, PNG)).toBe(false)
  })

  it('keeps the bytes that arrived', () => {
    const dir = warmCache([{ url: PNG, status: 200 }])
    forgetErrorResponses(dir)
    expect(isCached(dir, PNG)).toBe(true)
  })

  it('keeps a timeout, which is expensive to rediscover', () => {
    const dir = warmCache([{ url: PNG, status: 0 }])
    forgetErrorResponses(dir)
    expect(isCached(dir, PNG)).toBe(true)
  })
})

describe('forgetUnreachable', () => {
  it('forgets a timeout, which is what --refresh is for', () => {
    const dir = warmCache([{ url: PNG, status: 0 }])
    forgetUnreachable(dir)
    expect(isCached(dir, PNG)).toBe(false)
  })

  it('keeps the bytes that arrived', () => {
    const dir = warmCache([{ url: PNG, status: 200 }])
    forgetUnreachable(dir)
    expect(isCached(dir, PNG)).toBe(true)
  })
})

/** Enough of Playwright to run the route handler `installAssetCache` registers. */
function routing(dir: string) {
  let handler: ((route: Route) => Promise<void>) | undefined
  const context = {
    route: (_pattern: string, given: (route: Route) => Promise<void>) => {
      handler = given
      return Promise.resolve()
    },
  } as unknown as BrowserContext
  const cache: AssetCache = { unreachable: new Set(), fetched: 0 }

  return {
    cache,
    install: () => installAssetCache(context, { origin: 'http://localhost:6006', dir, cache }),
    async request(url: string) {
      const served = { fulfilled: null as { status: number } | null, aborted: false, fetched: 0 }
      await handler?.({
        request: () => ({ url: () => url, resourceType: () => 'image' }),
        fulfill: (options: { status: number }) => {
          served.fulfilled = options
          return Promise.resolve()
        },
        abort: () => {
          served.aborted = true
          return Promise.resolve()
        },
        continue: () => Promise.resolve(),
        fetch: () => {
          served.fetched += 1
          return Promise.reject(new Error('the test serves nothing'))
        },
      } as unknown as Route)
      return served
    },
  }
}

describe('installAssetCache', () => {
  it('reports a cached error response instead of replaying it as a picture', async () => {
    const routes = routing(warmCache([{ url: PNG, status: 403 }]))
    await routes.install()
    const served = await routes.request(PNG)

    expect(served.aborted).toBe(true)
    expect(served.fulfilled).toBeNull()
    expect(routes.cache.unreachable).toContain(PNG)
  })

  it('replays a cached error response for the rest of the run, rather than refetching', async () => {
    // Both sides of one comparison read this cache. A 5xx that clears halfway
    // through the run must not give the current capture a photograph the
    // baseline capture never got — that is the flake #226 exists to kill.
    const routes = routing(warmCache([{ url: PNG, status: 503 }]))
    await routes.install()
    const first = await routes.request(PNG)
    const second = await routes.request(PNG)

    expect(first.fetched).toBe(0)
    expect(second.fetched).toBe(0)
    expect(second.aborted).toBe(first.aborted)
  })

  it('replays the bytes that arrived', async () => {
    const routes = routing(warmCache([{ url: PNG, status: 200 }]))
    await routes.install()
    const served = await routes.request(PNG)

    expect(served.fulfilled?.status).toBe(200)
    expect(routes.cache.unreachable.size).toBe(0)
  })
})

describe('freezeSvg', () => {
  const svg = '<svg><style>.a { animation: pulse 3s infinite }</style><g class="a"/></svg>'

  it('appends the freeze after the asset’s own styles', () => {
    const frozen = freezeSvg(svg)
    expect(frozen.indexOf('animation-iteration-count')).toBeGreaterThan(frozen.indexOf('pulse'))
    expect(frozen.endsWith('</svg>')).toBe(true)
  })

  it('leaves something that is not an SVG alone', () => {
    expect(freezeSvg('not markup')).toBe('not markup')
  })
})
