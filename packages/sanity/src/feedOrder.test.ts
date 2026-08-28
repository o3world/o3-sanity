import { evaluate, parse } from 'groq-js'
import { describe, expect, it } from 'vitest'

import { CASE_STUDIES_PAGE_QUERY, INSIGHTS_PAGE_QUERY } from './queries'

/**
 * THE PINNED HEAD OF A COLLECTION FEED (#pinnedItems).
 *
 * The two index queries are the only place the combined ordering exists —
 * `collectionIndex.pinnedItems` first, in the editor's order, then everything
 * else newest-first — and the slice runs over the joined sequence, so a page
 * boundary can fall inside the pinned head or after it. That is arithmetic
 * GROQ does and a renderer never sees, which is why it is checked here
 * against a real evaluator rather than asserted through a rendered page.
 *
 * `groq-js` is Sanity's own GROQ implementation, so the query under test is
 * the exact string the dataset answers, not a re-expression of it.
 */
async function run(query: string, dataset: unknown[], params: Record<string, unknown>) {
  // `parse` takes the params too: a slice written `[$offset...$end]` is only
  // a slice once the parser can see numbers there.
  const result = await evaluate(parse(query, { params }), { dataset, params })
  return (await result.get()) as { items: Array<{ _id: string }>; total: number }
}

function insight(id: string, publishedAt: string, categories: string[] = []) {
  return {
    _id: id,
    _type: 'insight',
    title: id,
    slug: { _type: 'slug', current: id },
    publishedAt,
    body: [],
    categories: categories.map((ref) => ({ _type: 'reference', _ref: ref })),
  }
}

function caseStudy(id: string, publishedAt: string) {
  return {
    _id: id,
    _type: 'caseStudy',
    title: id,
    slug: { _type: 'slug', current: id },
    publishedAt,
  }
}

function category(id: string, slug: string) {
  return { _id: id, _type: 'category', title: slug, slug: { _type: 'slug', current: slug } }
}

function index(collection: string, pinned: string[]) {
  return {
    _id: `collectionIndex-${collection}`,
    _type: 'collectionIndex',
    collection,
    pinnedItems: pinned.map((ref, i) => ({ _type: 'reference', _key: `k${i}`, _ref: ref })),
  }
}

const ids = (items: Array<{ _id: string }>) => items.map((item) => item._id)

describe('the /work feed', () => {
  const studies = [
    caseStudy('cs-a', '2026-01-01'),
    caseStudy('cs-b', '2026-02-01'),
    caseStudy('cs-c', '2026-03-01'),
    caseStudy('cs-d', '2026-04-01'),
  ]

  it('is newest-first when nothing is pinned', async () => {
    const data = await run(CASE_STUDIES_PAGE_QUERY, [...studies], { offset: 0, end: 10 })
    expect(ids(data.items)).toEqual(['cs-d', 'cs-c', 'cs-b', 'cs-a'])
    expect(data.total).toBe(4)
  })

  it('is newest-first when the index document has no list', async () => {
    const data = await run(CASE_STUDIES_PAGE_QUERY, [...studies, index('caseStudy', [])], {
      offset: 0,
      end: 10,
    })
    expect(ids(data.items)).toEqual(['cs-d', 'cs-c', 'cs-b', 'cs-a'])
    expect(data.total).toBe(4)
  })

  it('leads with the pinned entries in the order they are listed', async () => {
    const data = await run(
      CASE_STUDIES_PAGE_QUERY,
      [...studies, index('caseStudy', ['cs-a', 'cs-c'])],
      { offset: 0, end: 10 },
    )
    expect(ids(data.items)).toEqual(['cs-a', 'cs-c', 'cs-d', 'cs-b'])
    expect(data.total).toBe(4)
  })

  it('pages over the joined sequence', async () => {
    const dataset = [...studies, index('caseStudy', ['cs-a', 'cs-c'])]
    const first = await run(CASE_STUDIES_PAGE_QUERY, dataset, { offset: 0, end: 3 })
    const second = await run(CASE_STUDIES_PAGE_QUERY, dataset, { offset: 3, end: 6 })
    expect(ids(first.items)).toEqual(['cs-a', 'cs-c', 'cs-d'])
    expect(ids(second.items)).toEqual(['cs-b'])
  })

  it('ignores a pinned entry pointing at nothing, or at another collection', async () => {
    const data = await run(
      CASE_STUDIES_PAGE_QUERY,
      [...studies, insight('i-a', '2026-05-01'), index('caseStudy', ['gone', 'i-a', 'cs-b'])],
      { offset: 0, end: 10 },
    )
    expect(ids(data.items)).toEqual(['cs-b', 'cs-d', 'cs-c', 'cs-a'])
    expect(data.total).toBe(4)
  })

  it('reads the index for its own collection', async () => {
    const data = await run(CASE_STUDIES_PAGE_QUERY, [...studies, index('insight', ['cs-a'])], {
      offset: 0,
      end: 10,
    })
    expect(ids(data.items)).toEqual(['cs-d', 'cs-c', 'cs-b', 'cs-a'])
  })
})

describe('the /insights feed', () => {
  const design = category('cat-design', 'design')
  const insights = [
    insight('i-a', '2026-01-01', ['cat-design']),
    insight('i-b', '2026-02-01'),
    insight('i-c', '2026-03-01', ['cat-design']),
    insight('i-d', '2026-04-01'),
  ]

  it('leads with the pinned entries on the unfiltered index', async () => {
    const data = await run(
      INSIGHTS_PAGE_QUERY,
      [design, ...insights, index('insight', ['i-a', 'i-c'])],
      { offset: 0, end: 10, category: null },
    )
    expect(ids(data.items)).toEqual(['i-a', 'i-c', 'i-d', 'i-b'])
    expect(data.total).toBe(4)
  })

  it('falls back to plain date order under a category filter', async () => {
    const data = await run(
      INSIGHTS_PAGE_QUERY,
      [design, ...insights, index('insight', ['i-a', 'i-c'])],
      { offset: 0, end: 10, category: 'design' },
    )
    expect(ids(data.items)).toEqual(['i-c', 'i-a'])
    expect(data.total).toBe(2)
  })
})
