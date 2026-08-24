import { describe, expect, it } from 'vitest'

import { INSIGHT_QUERY, INSIGHTS_PAGE_QUERY, SITE_SETTINGS_QUERY } from '@o3/sanity/queries'
import { buildDetailRoute, buildIndexRoute } from '@o3/content-runtime/routes'

import { insight, insightIndex } from '@/content/documents'
import { anInsight, anInsightsPage, renderRoute, siteSettings, type FetchCall } from '@/test'

/**
 * Every read a route makes says which cut of the dataset it wants (#266).
 *
 * Under Cache Components `sanityFetch` runs inside a `'use cache'` boundary,
 * where `draftMode()` and `cookies()` cannot be read — so the perspective and
 * the stega flag are arguments the route resolves per request and hands in.
 * They are also cache-key parts, which is what keeps one visitor's draft
 * preview out of the entry every other visitor shares.
 *
 * What this layer can see is the route builders' half of that: that every
 * read is threaded the mode the request resolved to, and that metadata's read
 * is forced stega-free whatever the mode. The resolver itself lives behind
 * `@o3/content-runtime/live`, which the layer stubs wholesale — a draft
 * render here gets the state a plain Presentation session is in.
 */
const detail = buildDetailRoute(insight)
const index = buildIndexRoute(insightIndex)

function dataset(call: FetchCall): unknown {
  if (call.query === SITE_SETTINGS_QUERY) return siteSettings()
  if (call.query === INSIGHTS_PAGE_QUERY) return anInsightsPage([anInsight()], 1)
  return anInsight()
}

function reads(calls: readonly FetchCall[], query: string): readonly FetchCall[] {
  return calls.filter((call) => call.query === query)
}

describe('an ordinary request', () => {
  it('reads published content with no stega on a detail route', async () => {
    const { calls } = await renderRoute(detail, { data: dataset, params: { slug: 'an-insight' } })

    const page = reads(calls, INSIGHT_QUERY)
    expect(page.length).toBeGreaterThan(0)
    for (const call of page) {
      expect(call.perspective).toBe('published')
      expect(call.stega).toBe(false)
    }
  })

  it('reads published content with no stega on an index route', async () => {
    const { calls } = await renderRoute(index, { data: dataset })

    const feed = reads(calls, INSIGHTS_PAGE_QUERY)
    expect(feed.length).toBeGreaterThan(0)
    for (const call of feed) {
      expect(call.perspective).toBe('published')
      expect(call.stega).toBe(false)
    }
  })

  it('reads Site Settings published, with no stega', async () => {
    const { calls } = await renderRoute(detail, { data: dataset, params: { slug: 'an-insight' } })
    const settings = reads(calls, SITE_SETTINGS_QUERY)

    expect(settings.length).toBeGreaterThan(0)
    for (const call of settings) {
      expect(call.perspective).toBe('published')
      expect(call.stega).toBe(false)
    }
  })
})

describe('a draft request', () => {
  it('reads drafts, with stega on for the overlays', async () => {
    const { calls } = await renderRoute(detail, {
      data: dataset,
      params: { slug: 'an-insight' },
      draft: true,
    })

    const page = reads(calls, INSIGHT_QUERY).filter((call) => call.stega === true)
    expect(page.length).toBeGreaterThan(0)
    for (const call of page) expect(call.perspective).toBe('drafts')
  })

  /**
   * stega characters are invisible in a browser and corrupt whatever a
   * scraper reads out of `<title>` and the OG tags — so the metadata read
   * stays stega-free in every mode, drafts included.
   */
  it('still reads metadata with stega off', async () => {
    const { calls } = await renderRoute(detail, {
      data: dataset,
      params: { slug: 'an-insight' },
      draft: true,
    })

    const stegaFree = reads(calls, INSIGHT_QUERY).filter((call) => call.stega === false)
    expect(stegaFree.length).toBeGreaterThan(0)
    for (const call of stegaFree) expect(call.perspective).toBe('drafts')
  })

  it('reads drafts on an index route too', async () => {
    const { calls } = await renderRoute(index, { data: dataset, draft: true })

    const feed = reads(calls, INSIGHTS_PAGE_QUERY)
    expect(feed.length).toBeGreaterThan(0)
    for (const call of feed) {
      expect(call.perspective).toBe('drafts')
      expect(call.stega).toBe(true)
    }
  })
})

/**
 * An index feed carries no document tag — it lists a type rather than
 * rendering one document — so its half of the revalidation contract has no
 * home in a per-document test. The detail half is pinned beside the insight
 * route.
 */
describe('an index read', () => {
  it('is tagged by every type its feed lists', async () => {
    const { calls } = await renderRoute(index, { data: dataset })

    const feed = reads(calls, INSIGHTS_PAGE_QUERY)
    expect(feed.length).toBeGreaterThan(0)
    for (const call of feed) expect(call.tags).toContain('sanity:insight')
  })
})
