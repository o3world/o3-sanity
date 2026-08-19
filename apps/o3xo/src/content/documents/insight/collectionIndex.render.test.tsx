import { describe, expect, it } from 'vitest'

import { INSIGHTS_PAGE_QUERY } from '@o3/sanity/queries'

import { buildIndexRoute } from '@o3/content-runtime/routes'
import {
  anInsight,
  anInsightsPage,
  renderRoute,
  siteSettings,
  withSettings,
  type FetchCall,
} from '@/test'

import { insightIndex } from './collectionIndex'

/**
 * The paginated, filterable insights index at this brand's prefix.
 *
 * The pagination and filter mechanics belong to `buildIndexRoute` and are
 * pinned once in apps/web. What is asserted here is what this app's entry and
 * view decide: the prefix every link is built from, the collection's name, the
 * page size, and the copy that is this app's rather than O3's.
 */
const route = buildIndexRoute(insightIndex)

const CATEGORIES = [
  { title: 'AI', slug: 'artificial-intelligence-ai' },
  { title: 'Design', slug: 'design' },
]

function manyInsights(count: number) {
  return Array.from({ length: count }, (_, i) =>
    anInsight({ _id: `insight-${i}`, title: `Insight ${i}`, slug: `insight-${i}` }),
  )
}

function render(data: unknown, searchParams?: Record<string, string>) {
  return renderRoute(route, {
    data: withSettings(data, siteSettings({ title: 'O3XO' })),
    searchParams,
  })
}

/** Just the feed fetches — every route also fetches Site Settings (#26). */
function feedCalls(calls: readonly FetchCall[]): readonly FetchCall[] {
  return calls.filter((call) => call.query === INSIGHTS_PAGE_QUERY)
}

describe('the insights index route', () => {
  it('takes its name from brand config', async () => {
    const { metadata } = await render(anInsightsPage())
    expect(metadata.title).toBe('Insights')
  })

  it('canonicalises at this brand’s prefix', async () => {
    const { metadata } = await render(anInsightsPage())
    expect(metadata.alternates?.canonical).toBe('http://localhost:3000/insights')
  })

  it('links each card at its own detail URL', async () => {
    const { html } = await render(anInsightsPage(manyInsights(3), 3))
    expect(html).toContain('href="/insights/insight-0"')
    expect(html).toContain('href="/insights/insight-2"')
  })

  it('slices the feed twelve at a time', async () => {
    const { calls } = await render(anInsightsPage(manyInsights(12), 40), { page: '2' })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ offset: 12, end: 24 })
  })

  it('keeps the prefix on the pager and the chips', async () => {
    const { html } = await render(anInsightsPage(manyInsights(12), 40, CATEGORIES), {
      category: 'design',
      page: '2',
    })

    expect(html).toContain('href="/insights?category=design"')
    expect(html).toContain('href="/insights?category=design&amp;page=3"')
  })

  /**
   * The frame's closing CTA band is deliberately absent until this brand has
   * its own line and its own contact route — see the note at the foot of
   * `InsightIndexView`. A band carrying O3's sentence over a link that 404s is
   * what this asserts against.
   */
  it('does not close on O3’s CTA band', async () => {
    const { html } = await render(anInsightsPage(manyInsights(3), 3))
    expect(html).not.toContain('Let’s get started on your next big thing.')
    expect(html).not.toContain('href="/contact"')
  })

  it('says the collection is empty rather than drawing an empty grid', async () => {
    const { html } = await render(anInsightsPage([], 0, CATEGORIES), { category: 'nothing-here' })
    expect(html).toContain('No insights under that filter yet.')
  })
})

/**
 * The route half of the #40 provisional mechanism (ADR 0007). A collection
 * index has no document (CONTEXT.md), so its marker lives on the route entry —
 * and the rules are the ones `tools/migration/src/seed.test.ts` holds for
 * documents, because a marker that behaves differently depending on where it
 * is written is a marker nobody trusts.
 *
 * This index is provisional: its composition is borrowed from O3's canonical
 * Insights frame and its hero copy is a placeholder. #218 is what clears it.
 */
describe('insights index provenance', () => {
  it('says what would clear it while it is provisional', () => {
    expect(insightIndex.migration?.provisional).toBe(true)
    expect(insightIndex.migration?.provisionalNote?.trim()).toBeTruthy()
  })

  it('claims no frame of its own while it is provisional', () => {
    // Mutually exclusive by definition: `figmaNode` says the composition was
    // transcribed from a frame drawn for this route, `provisional` says none
    // was. The borrowed frame is named in the note, not in the field.
    expect(insightIndex.migration?.figmaNode).toBeUndefined()
  })
})
