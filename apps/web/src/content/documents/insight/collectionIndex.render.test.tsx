import { describe, expect, it } from 'vitest'

import { INSIGHTS_PAGE_QUERY } from '@o3/sanity/queries'

import { buildIndexRoute } from '@o3/content-runtime/routes'
import {
  anInsight,
  anInsightsPage,
  classTokens,
  renderRoute,
  unprefixedHorizontalScrollUtilities,
  variantsOf,
  type FetchCall,
} from '@/test'

import { insightIndex } from './collectionIndex'

/**
 * The paginated, filterable /insights index.
 *
 * Two things on this route are real logic rather than layout: an out-of-range
 * `?page=` must clamp rather than 404 or render an empty grid, and
 * `?category=` must reach the query as a GROQ param and come back to the view
 * as the chip that looks selected. Both are pinned here, along with the
 * composition the canonical frame (`2336:4310`, #61) settles.
 */
const route = buildIndexRoute(insightIndex)

/**
 * Just the feed fetches. Every route also fetches Site Settings for the SEO
 * defaults tier (#26), and pagination assertions are about the feed.
 */
function feedCalls(calls: readonly FetchCall[]): readonly FetchCall[] {
  return calls.filter((call) => call.query === INSIGHTS_PAGE_QUERY)
}

function manyInsights(count: number) {
  return Array.from({ length: count }, (_, i) =>
    anInsight({
      _id: `insight-${i}`,
      title: `Insight ${i}`,
      slug: `insight-${i}`,
    }),
  )
}

const CATEGORIES = [
  { title: 'AI', slug: 'artificial-intelligence-ai' },
  { title: 'Design', slug: 'design' },
]

describe('insights collection index route', () => {
  it('renders the items on the first page', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3),
    })

    expect(html).toContain('Insight 0')
    expect(html).toContain('Insight 2')
  })

  it('defaults to page 1 when no page param is given', async () => {
    const { calls } = await renderRoute(route, { data: anInsightsPage(manyInsights(3), 3) })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ offset: 0, end: 12 })
  })

  it('slices the feed by the requested page', async () => {
    const { calls } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(12), 40),
      searchParams: { page: '2' },
    })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ offset: 12, end: 24 })
  })

  it('clamps a page past the end back to the last real page', async () => {
    const { calls } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(12), 20),
      searchParams: { page: '99' },
    })

    // 20 items at 12/page = 2 pages; the clamp refetches page 2.
    expect(feedCalls(calls)).toHaveLength(2)
    expect(feedCalls(calls)[1]?.params).toMatchObject({ offset: 12, end: 24 })
  })

  it('treats junk page params as page 1 without a second fetch', async () => {
    const { calls } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3),
      searchParams: { page: 'not-a-number' },
    })

    expect(feedCalls(calls)).toHaveLength(1)
    expect(feedCalls(calls)[0]?.params).toMatchObject({ offset: 0, end: 12 })
  })

  it('uses the entry’s static metadata', async () => {
    const { metadata } = await renderRoute(route, { data: anInsightsPage() })
    expect(metadata.title).toBe('Insights')
  })

  it('links each card at its own detail URL', async () => {
    const { html } = await renderRoute(route, { data: anInsightsPage(manyInsights(3), 3) })
    expect(html).toContain('href="/insights/insight-0"')
  })

  /**
   * The card draws no byline in either state — the frame (`2337:4493`) gives
   * it a meta line and a title and nothing else. Worth pinning now that a
   * byline is optional (#32 item 1.1): the card is the one surface where
   * "authorless" must be indistinguishable from "authored", and the projection
   * hands it an `author` it deliberately ignores.
   */
  it('draws no author on a card, with or without one', async () => {
    const authored = anInsight({
      _id: 'p-authored',
      slug: 'authored',
      title: 'Authored',
      author: { name: 'Christine Sheller', title: 'Chief Experience Officer', headshot: null },
    })
    const anonymous = anInsight({
      _id: 'p-anonymous',
      slug: 'anonymous',
      title: 'Anonymous',
      author: null,
    })
    const { html } = await renderRoute(route, {
      data: anInsightsPage([authored, anonymous], 2),
    })

    expect(html).toContain('Authored')
    expect(html).toContain('Anonymous')
    expect(html).not.toContain('Christine Sheller')
  })
})

/**
 * The category filter (#61) — the question `2337:4486` answered and #49 left
 * open. It is a URL parameter resolved on the server, so every assertion here
 * is about the request and the markup, and none is about client state.
 */
describe('insights index category filter', () => {
  it('passes no category to the query on the unfiltered index', async () => {
    const { calls } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3, CATEGORIES),
    })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ category: null })
  })

  it('hands the requested category to the query as a GROQ param', async () => {
    const { calls } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3, CATEGORIES),
      searchParams: { category: 'design' },
    })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ category: 'design' })
  })

  it('draws one chip per category, plus All', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3, CATEGORIES),
    })

    expect(html).toContain('href="/insights"')
    expect(html).toContain('href="/insights?category=artificial-intelligence-ai"')
    expect(html).toContain('href="/insights?category=design"')
    expect(html).toContain('>All<')
    expect(html).toContain('>Design<')
  })

  it('marks the active chip — and only it — as current', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3, CATEGORIES),
      searchParams: { category: 'design' },
    })
    expect(html.match(/aria-current="page"/g)).toHaveLength(1)
    // The selected chip is Theme=Black (`2337:4542`): ink fill, white label.
    expect(html).toMatch(/aria-current="page"[^>]*href="\/insights\?category=design"/)
  })

  it('marks All as current when nothing is filtered', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(3), 3, CATEGORIES),
    })
    expect(html).toMatch(/aria-current="page"[^>]*href="\/insights"/)
  })

  it('keeps the filter on every pager link', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(12), 40, CATEGORIES),
      searchParams: { category: 'design', page: '2' },
    })

    expect(html).toContain('href="/insights?category=design"')
    expect(html).toContain('href="/insights?category=design&amp;page=3"')
  })

  /** A chip is a fresh cut of the collection; page 4 of the old one is not in it. */
  it('drops the page when a chip is followed', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(12), 40, CATEGORIES),
      searchParams: { category: 'design', page: '2' },
    })
    expect(html).toContain('href="/insights?category=artificial-intelligence-ai"')
    expect(html).not.toContain('category=artificial-intelligence-ai&amp;page=')
  })

  it('clamps a filtered page against the filtered total, not the collection', async () => {
    const { calls } = await renderRoute(route, {
      data: anInsightsPage(manyInsights(2), 2, CATEGORIES),
      searchParams: { category: 'design', page: '9' },
    })

    // Two matches is one page, so the clamp refetches page 1 — with the
    // filter still on it.
    expect(feedCalls(calls)).toHaveLength(2)
    expect(feedCalls(calls)[1]?.params).toMatchObject({ offset: 0, end: 12, category: 'design' })
  })

  it('says so rather than drawing an empty grid', async () => {
    const { html } = await renderRoute(route, {
      data: anInsightsPage([], 0, CATEGORIES),
      searchParams: { category: 'nothing-here' },
    })
    expect(html).toContain('No insights under that filter')
  })

  it('draws no bar at all when nothing is categorised', async () => {
    const { html } = await renderRoute(route, { data: anInsightsPage(manyInsights(3), 3, []) })
    expect(html).not.toContain('aria-label="Filter by category"')
  })
})

/**
 * The composition, read off `2336:4310`. Every value below is on the frame and
 * the node is named beside it, so the next person can check it rather than
 * trust it — the same job the borrowed-values block did while this route was
 * provisional (#49).
 */
const page = await renderRoute(route, {
  data: anInsightsPage(manyInsights(12), 40, CATEGORIES),
  searchParams: { page: '2' },
})

describe('insights index composition', () => {
  it('opens on the Interior Hero, in the frame’s own words', () => {
    // `2336:4477` — the hero the frame writes, standfirst included. That line
    // is the one this route used to carry as unsourced copy.
    expect(page.html).toContain('News of the world')
    expect(page.html).toContain('Looking for some firsthand knowledge from our world?')
    expect(page.html).toContain('Insights')
  })

  it('paints the hero ink rather than the Work band’s warm black', () => {
    // The 2026-08 `Interior Hero` component (`2101:828`) is #0A0A0B; the older
    // Work/Live band is #0F100B and stays that way until its frame is redrawn.
    const tokens = classTokens(page.html)
    expect(tokens).toContain('bg-ink')
    expect(tokens).not.toContain('bg-ink-warm')
  })

  it('lays the cards on a bone band at the frame’s 128px rhythm', () => {
    // `2337:4485`: fill #F1F0EC, padding 128px 96px.
    const tokens = classTokens(page.html)
    expect(tokens).toContain('bg-bone')
    expect(tokens).toContain('py-band-md')
  })

  it('fills the 1248 column with three of the frame’s own cards', () => {
    // 3 × 395 + 2 × 32 = 1249 = --container-section. gap-x-8 is the 32.
    const tokens = classTokens(page.html)
    expect(tokens).toContain('max-w-section')
    expect(tokens).toContain('gap-x-8')
    expect(tokens).toContain('lg:grid-cols-3')
  })

  it('stacks to one column below lg — the two frames, nothing between', () => {
    // ADR 0006: composition switches at `lg`. A `md:grid-cols-2` would be a
    // third composition no frame draws.
    const tokens = classTokens(page.html)
    expect(tokens).toContain('grid-cols-1')
    expect(tokens.filter((t) => t.startsWith('md:grid-cols'))).toEqual([])
  })

  it('opens the rows to 64px where the frame says so, and 48 below it', () => {
    // `2337:4492` wraps its rows 64px apart at 1440. No frame stacks this card
    // at 402, so the mobile value is still the Blog band's 48 (`1814:1738`).
    expect(variantsOf(page.html, 'gap-y-12')).toEqual(['gap-y-12'])
    expect(variantsOf(page.html, 'gap-y-16')).toEqual(['lg:gap-y-16'])
  })

  it('closes on the shared CTA band', () => {
    // `2336:4351` — the component's own copy, which five seed pages carry too.
    expect(page.html).toContain('Let’s get started on your next big thing.')
    expect(page.html).toContain('href="/contact"')
  })

  it('gives a phone no hidden scroll region', () => {
    // The Home and About Blog rows bleed past the right edge; this one does
    // not, because there is nothing to scroll to.
    expect(unprefixedHorizontalScrollUtilities(page.html)).toEqual([])
  })
})

describe('insights index pager', () => {
  it('offers every page of the collection by number, not just the two neighbours', () => {
    // `page` above is this exact state: page 2 of 4 (#241).
    expect(page.html).toContain('href="/insights"')
    expect(page.html).toContain('href="/insights?page=2"')
    expect(page.html).toContain('href="/insights?page=3"')
    expect(page.html).toContain('href="/insights?page=4"')

    // Scoped to the pager: the selected filter chip carries `aria-current`
    // too, and it is a different "current" — the cut on screen, not the page.
    const pager = page.html.slice(page.html.indexOf('aria-label="Pagination"'))
    const current = pager.match(/<a[^>]*aria-current="page"[^>]*>/)?.[0] ?? ''
    expect(current).toContain('href="/insights?page=2"')
  })

  it('drops Previous on the first page and Next on the last', async () => {
    const first = await renderRoute(route, { data: anInsightsPage(manyInsights(12), 40) })
    expect(first.html).toContain('Next')
    expect(first.html).not.toContain('Previous')

    const last = await renderRoute(route, {
      data: anInsightsPage(manyInsights(4), 40),
      searchParams: { page: '4' },
    })
    expect(last.html).toContain('Previous')
    expect(last.html).not.toContain('>Next')
  })

  it('renders no pager at all when the collection fits on one page', async () => {
    const { html } = await renderRoute(route, { data: anInsightsPage(manyInsights(3), 3) })
    expect(html).not.toContain('aria-label="Pagination"')
  })

  it('marks the two links up as prev/next for a crawler', () => {
    expect(page.html).toContain('rel="prev"')
    expect(page.html).toContain('rel="next"')
  })
})
