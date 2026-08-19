import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'
import {
  buildCatchAllRoute,
  buildDetailRoute,
  buildIndexRoute,
  buildSingletonRoute,
} from '@o3/content-runtime/routes'

import { CATCH_ALL_TYPES, home, insight, insightIndex } from '@/content/documents'
import {
  aSeededPage,
  anInsight,
  anInsightsPage,
  renderRoute,
  siteSettings,
  withSettings,
  type FetchCall,
} from '@/test'

/**
 * No route builder may turn stega encoding on (#229).
 *
 * Stega is what makes Presentation's click-to-edit work, and next-sanity
 * already decides when it belongs: `defineLive`'s `sanityFetch` encodes only
 * when the server has a token, the client has a `studioUrl`, and the request
 * is in draft mode. A builder that passes `stega: true` overrides all three,
 * so every anonymous visitor gets the invisible characters too — which is what
 * shipped to both deployments until this file existed.
 *
 * The rule is therefore a negative: a body fetch says nothing about stega and
 * lets next-sanity gate it; a metadata fetch says `stega: false`, because
 * `<title>` and OG tags are text no browser renders and no gate should reach.
 *
 * The stub behind `renderRoute` stands in for next-sanity, so what these pin
 * is the argument the builder passes, not the gate's own verdict.
 */
function stegaOn(calls: readonly FetchCall[]): readonly FetchCall[] {
  return calls.filter((call) => call.stega === true)
}

function metadataCalls(calls: readonly FetchCall[]): readonly FetchCall[] {
  return calls.filter((call) => call.stega === false)
}

describe('stega is left to next-sanity’s draft-mode gate', () => {
  it('on the singleton route', async () => {
    const { calls } = await renderRoute(buildSingletonRoute(home), {
      data: withSettings(aSeededPage('index'), siteSettings()),
    })
    expect(stegaOn(calls)).toEqual([])
  })

  it('on the catch-all route', async () => {
    const { calls } = await renderRoute(buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY), {
      data: withSettings(aSeededPage('index'), siteSettings()),
      params: { segments: ['about'] },
    })
    expect(stegaOn(calls)).toEqual([])
  })

  it('on the detail route', async () => {
    const { calls } = await renderRoute(buildDetailRoute(insight), {
      data: anInsight({ title: 'An insight' }),
      params: { slug: 'an-insight' },
    })
    expect(stegaOn(calls)).toEqual([])
  })

  it('on a collection index', async () => {
    const { calls } = await renderRoute(buildIndexRoute(insightIndex), {
      data: anInsightsPage([anInsight({ title: 'An insight' })], 1),
    })
    expect(stegaOn(calls)).toEqual([])
  })
})

describe('metadata still reads with stega off', () => {
  it('on the singleton route', async () => {
    const { calls } = await renderRoute(buildSingletonRoute(home), {
      data: withSettings(aSeededPage('index'), siteSettings()),
    })
    expect(metadataCalls(calls).length).toBeGreaterThan(0)
  })

  it('on the detail route', async () => {
    const { calls } = await renderRoute(buildDetailRoute(insight), {
      data: anInsight({ title: 'An insight' }),
      params: { slug: 'an-insight' },
    })
    expect(metadataCalls(calls).length).toBeGreaterThan(0)
  })
})
