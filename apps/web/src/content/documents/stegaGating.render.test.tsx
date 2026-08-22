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
 * Stega is what makes Presentation's click-to-edit work, and it belongs to
 * draft sessions only. Every read a builder makes takes its `stega` flag from
 * `currentReadMode`, whose published mode is stega-free — a builder that named
 * `stega: true` itself would hand the invisible characters to every anonymous
 * visitor, which is what shipped to both deployments until this file existed.
 *
 * `readMode.render.test.tsx` pins the mode threading on the detail and index
 * builders; this file pins the negative — no builder, singleton and catch-all
 * included, ever turns stega on for a published render.
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
