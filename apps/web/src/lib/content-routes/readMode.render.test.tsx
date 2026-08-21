import { describe, expect, it } from 'vitest'

import { INSIGHT_QUERY, INSIGHTS_PAGE_QUERY, SITE_SETTINGS_QUERY } from '@o3/sanity/queries'

import { insight, insightIndex } from '@/content/documents'
import { buildDetailRoute, buildIndexRoute } from '@/lib/content-routes/build'
import { anInsight, anInsightsPage, renderRoute, siteSettings } from '@/test'
import type { FetchCall } from '@/test/stubs/sanity-live'

/**
 * Every read says which cut of the dataset it wants (#266).
 *
 * Under Cache Components `sanityFetch` runs inside a `'use cache'` boundary,
 * where `draftMode()` and `cookies()` cannot be read — so the perspective and
 * the stega flag are arguments the route resolves per request and hands in.
 * They are also cache-key parts, which is what keeps one visitor's draft
 * preview out of the entry every other visitor shares.
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

    for (const call of reads(calls, INSIGHT_QUERY)) {
      expect(call.perspective).toBe('published')
      expect(call.stega).toBe(false)
    }
  })

  it('reads published content with no stega on an index route', async () => {
    const { calls } = await renderRoute(index, { data: dataset })

    for (const call of reads(calls, INSIGHTS_PAGE_QUERY)) {
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
 * The webhook's half of the contract is untouched by the migration: the tag
 * set a fetch declares is what `/api/revalidate` flushes on publish.
 */
describe('cache tags survive the read-mode split', () => {
  it('tags a detail read by document and by type', async () => {
    const { calls } = await renderRoute(detail, { data: dataset, params: { slug: 'an-insight' } })

    for (const call of reads(calls, INSIGHT_QUERY)) {
      expect(call.tags).toContain('sanity:insight:an-insight')
      expect(call.tags).toContain('sanity:insight')
    }
  })

  it('tags an index read by every type its feed lists', async () => {
    const { calls } = await renderRoute(index, { data: dataset })

    for (const call of reads(calls, INSIGHTS_PAGE_QUERY)) {
      expect(call.tags).toContain('sanity:insight')
    }
  })
})
