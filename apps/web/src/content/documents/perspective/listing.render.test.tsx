import { describe, expect, it } from 'vitest'

import { buildListingRoute } from '@/lib/content-routes/build'
import { aPerspective, aPerspectivesPage, renderRoute } from '@/test'

import { perspectiveListing } from './listing'

/**
 * The paginated /perspectives index. Pagination is the only real logic on
 * this route — an out-of-range `?page=` must clamp rather than 404 or render
 * an empty grid, and the clamp costs a second fetch, so both are pinned here.
 */
const route = buildListingRoute(perspectiveListing)

function manyPerspectives(count: number) {
  return Array.from({ length: count }, (_, i) =>
    aPerspective({
      _id: `perspective-${i}`,
      title: `Perspective ${i}`,
      slug: `perspective-${i}`,
    }),
  )
}

describe('perspectives listing route', () => {
  it('renders the items on the first page', async () => {
    const { html } = await renderRoute(route, {
      data: aPerspectivesPage(manyPerspectives(3), 3),
    })

    expect(html).toContain('Perspective 0')
    expect(html).toContain('Perspective 2')
  })

  it('defaults to page 1 when no page param is given', async () => {
    const { calls } = await renderRoute(route, { data: aPerspectivesPage(manyPerspectives(3), 3) })
    expect(calls[0]?.params).toMatchObject({ offset: 0, end: 12 })
  })

  it('slices the feed by the requested page', async () => {
    const { calls } = await renderRoute(route, {
      data: aPerspectivesPage(manyPerspectives(12), 40),
      searchParams: { page: '2' },
    })
    expect(calls[0]?.params).toMatchObject({ offset: 12, end: 24 })
  })

  it('clamps a page past the end back to the last real page', async () => {
    const { calls } = await renderRoute(route, {
      data: aPerspectivesPage(manyPerspectives(12), 20),
      searchParams: { page: '99' },
    })

    // 20 items at 12/page = 2 pages; the clamp refetches page 2.
    expect(calls).toHaveLength(2)
    expect(calls[1]?.params).toMatchObject({ offset: 12, end: 24 })
  })

  it('treats junk page params as page 1 without a second fetch', async () => {
    const { calls } = await renderRoute(route, {
      data: aPerspectivesPage(manyPerspectives(3), 3),
      searchParams: { page: 'not-a-number' },
    })

    expect(calls).toHaveLength(1)
    expect(calls[0]?.params).toMatchObject({ offset: 0, end: 12 })
  })

  it('uses the entry’s static metadata', async () => {
    const { metadata } = await renderRoute(route, { data: aPerspectivesPage() })
    expect(metadata.title).toBe('Perspectives')
  })
})
