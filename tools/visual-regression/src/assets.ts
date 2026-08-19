/**
 * The network, turned into a fixture.
 *
 * A capture is only worth diffing if the code under test is the only thing that
 * can move a pixel. Everything the stories fetch from someone else's server
 * breaks that: 256 of the images in the suite come from `cdn.sanity.io`, and
 * whether a given one arrives before the shutter is a property of the morning's
 * bandwidth (#226). The homepage lost its partner logos in one run out of three
 * that way, and #213's token-only change reported ten diffs, every one of them
 * a photograph that had loaded on one side and not the other.
 *
 * So no capture reaches the network twice. The first run fetches each remote
 * asset once and writes it to `.vr/assets`; every run after that — and, more to
 * the point, the baseline capture and the current capture of the *same* run —
 * replays the same bytes off disk. Cache hits are instant, which also removes
 * the arrival race the settle timeout was being tuned around.
 *
 * Two kinds of remote request, handled differently:
 *
 * - **Static files** — images and fonts — are cached and replayed. The report
 *   keeps its real photographs, which is most of what makes a page mockup worth
 *   looking at.
 * - **Everything that executes** — a YouTube or Vimeo player document, its
 *   scripts, its ad beacons, the 26MB video the 1682 page embeds — is stubbed
 *   empty. Caching a player's HTML would not make it deterministic; it renders
 *   a different frame, a different consent state, and a different thumbnail
 *   every time it runs. The Embed stories are under test for their 16:9 frame
 *   and their iframe title, not for YouTube.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import type { BrowserContext, Route } from 'playwright'

import { freezeSvg } from './freeze'

/** Resource types worth keeping the real bytes of. */
const REPLAYED = new Set(['image', 'font'])

/** How many times a miss is fetched before it is recorded as unreachable. */
const ATTEMPTS = 3

interface CachedMeta {
  url: string
  /** HTTP status to replay, or 0 for "the fetch itself failed". */
  status: number
  contentType: string
}

/** Whether a cached entry holds an asset, as opposed to a server saying no. */
function arrived(status: number): boolean {
  return status >= 200 && status < 300
}

/**
 * Where a URL's bytes live.
 *
 * Hashed rather than derived from the path, because a Sanity CDN URL carries
 * its transform in the query string — `?w=828&auto=format` and `?w=1200` are
 * different pictures of the same asset and need different files.
 */
export function cachePath(dir: string, url: string): string {
  return path.join(dir, createHash('sha1').update(url).digest('hex'))
}

/** An empty response of the right shape for a request nothing may execute. */
export function stubFor(resourceType: string): { contentType: string; body: string } {
  switch (resourceType) {
    // Deliberately blank rather than a placeholder graphic: an unloaded iframe
    // is transparent, so the block's own frame is what the screenshot shows.
    case 'document':
      return { contentType: 'text/html; charset=utf-8', body: '<!doctype html><title>vr</title>' }
    case 'stylesheet':
      return { contentType: 'text/css; charset=utf-8', body: '' }
    case 'script':
      return { contentType: 'text/javascript; charset=utf-8', body: '' }
    case 'xhr':
    case 'fetch':
      return { contentType: 'application/json; charset=utf-8', body: '{}' }
    default:
      return { contentType: 'text/plain; charset=utf-8', body: '' }
  }
}

/** A URL the browser may reach without going through the cache. */
function isLocal(url: string, origin: string): boolean {
  return (
    url.startsWith(origin) ||
    url.startsWith('data:') ||
    url.startsWith('blob:') ||
    url.startsWith('about:')
  )
}

function readCached(file: string): { meta: CachedMeta; body: Buffer } | null {
  if (!fs.existsSync(`${file}.json`)) return null
  const meta = JSON.parse(fs.readFileSync(`${file}.json`, 'utf8')) as CachedMeta
  return { meta, body: fs.existsSync(file) ? fs.readFileSync(file) : Buffer.alloc(0) }
}

function writeCached(file: string, meta: CachedMeta, body: Buffer): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  // Written body-first and renamed into place, so a run killed mid-write
  // cannot leave a metadata file pointing at half a JPEG.
  fs.writeFileSync(`${file}.tmp`, body)
  fs.renameSync(`${file}.tmp`, file)
  fs.writeFileSync(`${file}.json`, JSON.stringify(meta))
}

export interface AssetCache {
  /** URLs this run could not fetch, and so served as a failed request. */
  unreachable: Set<string>
  /** Fetches made this run — zero on a warm cache. */
  fetched: number
}

/**
 * Route every request the context makes: local ones straight through, remote
 * ones out of `dir`, executables into the bin.
 */
export async function installAssetCache(
  context: BrowserContext,
  options: { origin: string; dir: string; cache: AssetCache },
): Promise<void> {
  const { origin, dir, cache } = options
  // One fetch per URL even when four workers ask for it at once.
  const inFlight = new Map<string, Promise<void>>()

  const fetchOnce = async (route: Route, url: string, file: string): Promise<void> => {
    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        const response = await route.fetch({ timeout: 20_000 })
        const body = await response.body()
        writeCached(
          file,
          {
            url,
            status: response.status(),
            contentType: response.headers()['content-type'] ?? 'application/octet-stream',
          },
          body,
        )
        cache.fetched += 1
        return
      } catch {
        if (attempt === ATTEMPTS) {
          writeCached(file, { url, status: 0, contentType: '' }, Buffer.alloc(0))
          cache.fetched += 1
        }
      }
    }
  }

  await context.route('**/*', async (route) => {
    const request = route.request()
    const url = request.url()
    if (isLocal(url, origin)) return route.continue()

    if (!REPLAYED.has(request.resourceType())) {
      const stub = stubFor(request.resourceType())
      return route.fulfill({ status: 200, contentType: stub.contentType, body: stub.body })
    }

    const file = cachePath(dir, url)
    if (!readCached(file)) {
      const pending = inFlight.get(url) ?? fetchOnce(route, url, file)
      inFlight.set(url, pending)
      await pending
      inFlight.delete(url)
    }

    const entry = readCached(file)
    // A miss that stayed a miss: serve the failure the network gave us, and
    // say so afterwards rather than letting a silently absent photograph read
    // as a pixel change. A 403 counts — the bytes are as absent as a timeout's,
    // and replaying the status instead of reporting it is what made #236's
    // stale 403 invisible.
    if (!entry || !arrived(entry.meta.status)) {
      cache.unreachable.add(url)
      return route.abort('failed')
    }
    // The freeze is applied on the way out rather than on the way in: the cache
    // holds the asset as the CDN sent it, so changing the rule costs no refetch.
    const body = entry.meta.contentType.includes('image/svg+xml')
      ? freezeSvg(entry.body.toString('utf8'))
      : entry.body
    return route.fulfill({ status: entry.meta.status, contentType: entry.meta.contentType, body })
  })
}

function forget(dir: string, doomed: (meta: CachedMeta) => boolean): void {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json')) continue
    const file = path.join(dir, name)
    const meta = JSON.parse(fs.readFileSync(file, 'utf8')) as CachedMeta
    if (doomed(meta)) fs.rmSync(file)
  }
}

/**
 * Drop the failures a server *answered* with, keeping the bytes that arrived.
 *
 * Run at the start of every run, because a cached 403 outlives its cause: the
 * URL gets fixed, the asset gets reuploaded, and the cache goes on serving the
 * refusal until someone thinks to empty `.vr/assets` by hand (#236). Re-asking
 * is cheap — the server answered last time, so it costs one round-trip — and
 * within a run the answer is still written to disk on first ask and replayed
 * from there, so a 5xx that clears halfway through cannot hand the current
 * capture a photograph the baseline capture never got.
 */
export function forgetErrorResponses(dir: string): void {
  forget(dir, (meta) => meta.status !== 0 && !arrived(meta.status))
}

/**
 * Drop the "could not fetch this at all" markers, keeping everything else.
 *
 * A cached timeout is what stops one bad minute of network from producing a
 * different screenshot every run, and rediscovering one is not cheap — three
 * attempts at twenty seconds, for every dead URL, before the first shutter.
 * So it survives until `--refresh` says the bad minute is over.
 */
export function forgetUnreachable(dir: string): void {
  forget(dir, (meta) => meta.status === 0)
}
