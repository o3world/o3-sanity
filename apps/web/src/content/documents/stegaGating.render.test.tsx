import { describe, expect, it } from 'vitest'

import { PAGE_QUERY } from '@o3/sanity/queries'
import {
  buildCatchAllRoute,
  buildIndexRoute,
  buildSingletonRoute,
} from '@o3/content-runtime/routes'

import { CATCH_ALL_TYPES, home, insightIndex } from '@/content/documents'
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
 * builders, the detail route's every read included. This file pins the
 * negative where that one does not reach: the singleton and catch-all
 * builders, and every read a collection index makes — its chrome document's
 * as well as the feed's.
 *
 * The stub behind `renderRoute` stands in for next-sanity, so what these pin
 * is the argument the builder passes, not the gate's own verdict.
 */
function stegaOn(calls: readonly FetchCall[]): readonly FetchCall[] {
  return calls.filter((call) => call.stega === true)
}

/**
 * The singleton home page in a draft render — the one mode where the page's
 * own read carries stega, so it and the metadata read can be told apart.
 * Rendered at module scope: a draft render's first pass is a cold import of
 * the lazy draft block renderer, which can outlast a test's timeout under
 * full-suite load.
 */
const draftHome = await renderRoute(buildSingletonRoute(home), {
  data: withSettings(aSeededPage('index'), siteSettings()),
  draft: true,
})

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
      params: { path: ['about'] },
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

/**
 * The detail route's half is `readMode.render.test.tsx`'s "still reads
 * metadata with stega off".
 */
describe('metadata reads with stega off in a draft render', () => {
  it('on the singleton route', () => {
    const page = draftHome.calls.filter((call) => call.query === PAGE_QUERY)
    expect(
      page.filter((call) => call.stega === true),
      'page read',
    ).not.toEqual([])
    expect(
      page.filter((call) => call.stega === false),
      'metadata read',
    ).not.toEqual([])
  })
})
