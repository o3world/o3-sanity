import { describe, expect, it } from 'vitest'

import { PERSPECTIVES_PAGE_QUERY } from '@o3/sanity/queries'

import { buildIndexRoute } from '@/lib/content-routes/build'
import {
  aPerspective,
  aPerspectivesPage,
  classTokens,
  renderRoute,
  unprefixedHorizontalScrollUtilities,
  variantsOf,
} from '@/test'
import type { FetchCall } from '@/test/stubs/sanity-live'

import { perspectiveIndex } from './collectionIndex'

/**
 * The paginated /perspectives index. Pagination is the only real logic on
 * this route — an out-of-range `?page=` must clamp rather than 404 or render
 * an empty grid, and the clamp costs a second fetch, so both are pinned here.
 *
 * The route is **provisional** (#49): no canonical frame draws it, so the
 * composition borrows the Work hero (`1634:1181`) and the Home Blog band
 * (`1683:2467`). The second describe block below holds the borrowed values, so
 * that a change to them is a deliberate act rather than a drift — this is the
 * only place the borrowing is written down as an assertion rather than as a
 * comment. The marker itself is `provisionalRoutes.render.test.tsx`.
 */
const route = buildIndexRoute(perspectiveIndex)

/**
 * Just the feed fetches. Every route also fetches Site Settings for the SEO
 * defaults tier (#26), and pagination assertions are about the feed.
 */
function feedCalls(calls: readonly FetchCall[]): readonly FetchCall[] {
  return calls.filter((call) => call.query === PERSPECTIVES_PAGE_QUERY)
}

function manyPerspectives(count: number) {
  return Array.from({ length: count }, (_, i) =>
    aPerspective({
      _id: `perspective-${i}`,
      title: `Perspective ${i}`,
      slug: `perspective-${i}`,
    }),
  )
}

describe('perspectives collection index route', () => {
  it('renders the items on the first page', async () => {
    const { html } = await renderRoute(route, {
      data: aPerspectivesPage(manyPerspectives(3), 3),
    })

    expect(html).toContain('Perspective 0')
    expect(html).toContain('Perspective 2')
  })

  it('defaults to page 1 when no page param is given', async () => {
    const { calls } = await renderRoute(route, { data: aPerspectivesPage(manyPerspectives(3), 3) })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ offset: 0, end: 12 })
  })

  it('slices the feed by the requested page', async () => {
    const { calls } = await renderRoute(route, {
      data: aPerspectivesPage(manyPerspectives(12), 40),
      searchParams: { page: '2' },
    })
    expect(feedCalls(calls)[0]?.params).toMatchObject({ offset: 12, end: 24 })
  })

  it('clamps a page past the end back to the last real page', async () => {
    const { calls } = await renderRoute(route, {
      data: aPerspectivesPage(manyPerspectives(12), 20),
      searchParams: { page: '99' },
    })

    // 20 items at 12/page = 2 pages; the clamp refetches page 2.
    expect(feedCalls(calls)).toHaveLength(2)
    expect(feedCalls(calls)[1]?.params).toMatchObject({ offset: 12, end: 24 })
  })

  it('treats junk page params as page 1 without a second fetch', async () => {
    const { calls } = await renderRoute(route, {
      data: aPerspectivesPage(manyPerspectives(3), 3),
      searchParams: { page: 'not-a-number' },
    })

    expect(feedCalls(calls)).toHaveLength(1)
    expect(feedCalls(calls)[0]?.params).toMatchObject({ offset: 0, end: 12 })
  })

  it('uses the entry’s static metadata', async () => {
    const { metadata } = await renderRoute(route, { data: aPerspectivesPage() })
    expect(metadata.title).toBe('Perspectives')
  })

  it('links each card at its own detail URL', async () => {
    const { html } = await renderRoute(route, { data: aPerspectivesPage(manyPerspectives(3), 3) })
    expect(html).toContain('href="/perspectives/perspective-0"')
  })
})

/**
 * The borrowed composition, #49. Every value below was read off a canonical
 * frame; the node is named beside it so the next person can check it rather
 * than trust it.
 */
const page = await renderRoute(route, {
  data: aPerspectivesPage(manyPerspectives(12), 40),
  searchParams: { page: '2' },
})

describe('perspectives index composition', () => {
  it('opens on the Work index’s hero band, with the Blog row’s headline', () => {
    // `1683:2469` — the Home Blog row's own line, not new copy.
    expect(page.html).toContain('The thinking behind the work.')
    // `1634:1183` treatment: the collection's name as the band's eyebrow.
    expect(page.html).toContain('Perspectives')
  })

  it('carries the one line of copy no frame writes', () => {
    // Flagged provisional on the entry. Asserted so that removing the marker
    // while leaving the copy — or the reverse — is visible.
    expect(page.html).toContain('What we tried, what broke')
  })

  it('lays the cards on the Blog band’s bone surface at its 96px rhythm', () => {
    // `1683:2467` and `1924:5388`: fill #F0F0F0, padding 96px 0.
    const tokens = classTokens(page.html)
    expect(tokens).toContain('bg-bone')
    expect(tokens).toContain('py-band-sm')
  })

  it('fills the 1248 column with three of the frame’s own cards', () => {
    // 3 × 394.67 + 2 × 32 = 1248 = --container-section. gap-x-8 is the 32.
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

  it('keeps the stacked cards 48px apart, the value read at 402', () => {
    // `1814:1738` sets 48 between stacked cards. Unprefixed: no frame stacks
    // this card at 1440, so the desktop row gap is that value carried up.
    expect(variantsOf(page.html, 'gap-y-12')).toEqual(['gap-y-12'])
  })

  it('gives a phone no hidden scroll region', () => {
    // The Home and About Blog rows bleed past the right edge; this one does
    // not, because there is nothing to scroll to.
    expect(unprefixedHorizontalScrollUtilities(page.html)).toEqual([])
  })
})

describe('perspectives index pager', () => {
  it('offers both directions in the middle of the collection', () => {
    // `page` above is this exact state: page 2 of 4.
    expect(page.html).toContain('href="/perspectives"')
    expect(page.html).toContain('href="/perspectives?page=3"')
    expect(page.html).toContain('Page 2 of 4')
  })

  it('drops Previous on the first page and Next on the last', async () => {
    const first = await renderRoute(route, { data: aPerspectivesPage(manyPerspectives(12), 40) })
    expect(first.html).toContain('Next')
    expect(first.html).not.toContain('Previous')

    const last = await renderRoute(route, {
      data: aPerspectivesPage(manyPerspectives(4), 40),
      searchParams: { page: '4' },
    })
    expect(last.html).toContain('Previous')
    expect(last.html).not.toContain('>Next')
  })

  it('renders no pager at all when the collection fits on one page', async () => {
    const { html } = await renderRoute(route, { data: aPerspectivesPage(manyPerspectives(3), 3) })
    expect(html).not.toContain('aria-label="Pagination"')
  })

  it('marks the two links up as prev/next for a crawler', () => {
    expect(page.html).toContain('rel="prev"')
    expect(page.html).toContain('rel="next"')
  })
})
