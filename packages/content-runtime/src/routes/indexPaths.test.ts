import { describe, expect, it } from 'vitest'

import { indexHref, indexQueryRedirects, readIndexState } from './indexPaths'

/**
 * A collection index spells its state in the path, so the path scheme is one
 * thing rather than four: what a chip links to, what a pager links to, what
 * `generateStaticParams` enumerates, and what the route reads back out of its
 * own segments. These tests are that scheme.
 */

describe('the path a page of a collection index has', () => {
  it('is the bare prefix for the unfiltered first page', () => {
    expect(indexHref('/insights', { facets: { category: null }, page: 1 })).toBe('/insights')
  })

  it('names the page after the prefix', () => {
    expect(indexHref('/insights', { facets: { category: null }, page: 3 })).toBe('/insights/page/3')
  })

  it('names the facet before the page', () => {
    expect(indexHref('/insights', { facets: { category: 'design' }, page: 2 })).toBe(
      '/insights/category/design/page/2',
    )
  })

  it('drops the page segment on a filtered first page', () => {
    expect(indexHref('/insights', { facets: { category: 'design' }, page: 1 })).toBe(
      '/insights/category/design',
    )
  })

  it('keeps the declared order when an index filters on more than one thing', () => {
    expect(indexHref('/work', { facets: { sector: 'health', service: 'design' }, page: 2 })).toBe(
      '/work/sector/health/service/design/page/2',
    )
  })

  it('encodes a value that is not already path-safe', () => {
    expect(indexHref('/insights', { facets: { category: 'life at o3' }, page: 1 })).toBe(
      '/insights/category/life%20at%20o3',
    )
  })
})

describe('the state a route reads back out of its segments', () => {
  it('reads the bare index as page one, unfiltered', () => {
    expect(readIndexState(['category'], {})).toEqual({ facets: { category: null }, page: 1 })
  })

  it('reads a page segment', () => {
    expect(readIndexState(['category'], { page: '4' })).toEqual({
      facets: { category: null },
      page: 4,
    })
  })

  it('reads a facet segment, decoded', () => {
    expect(readIndexState(['category'], { category: 'life%20at%20o3' })).toEqual({
      facets: { category: 'life at o3' },
      page: 1,
    })
  })

  it('reads a facet it was not asked about as absent, not as a filter', () => {
    expect(readIndexState(['category'], { sector: 'health' })).toEqual({
      facets: { category: null },
      page: 1,
    })
  })

  it('reports a page segment that is not a page at all', () => {
    // A path is a claim about a page that exists; `0`, `-1` and `two` are
    // claims about nothing, and the route answers them with a 404 rather than
    // by quietly serving page one.
    expect(readIndexState(['category'], { page: '0' })).toBeNull()
    expect(readIndexState(['category'], { page: 'two' })).toBeNull()
    expect(readIndexState(['category'], { page: '1' })).toBeNull()
  })
})

describe('the redirects that retire the query-string form', () => {
  const rules = indexQueryRedirects('/insights', ['category'])

  /** The first rule whose source matches and whose `has` keys are all present. */
  function match(keys: string[]) {
    return rules.find(
      (rule) =>
        (rule.has ?? []).length === keys.length &&
        (rule.has ?? []).every((clause) => keys.includes(clause.key)),
    )
  }

  it('sends ?page= to the page path', () => {
    expect(match(['page'])?.destination).toBe('/insights/page/:page')
  })

  it('sends ?category= to the facet path', () => {
    expect(match(['category'])?.destination).toBe('/insights/category/:category')
  })

  it('sends both together to the composed path', () => {
    expect(match(['category', 'page'])?.destination).toBe('/insights/category/:category/page/:page')
  })

  it('puts the two-parameter rule before the one-parameter rules', () => {
    const both = rules.findIndex((rule) => (rule.has ?? []).length === 2)
    const single = rules.findIndex((rule) => (rule.has ?? []).length === 1)
    expect(both).toBeLessThan(single)
  })

  it('retires page one rather than sending it to a path of its own', () => {
    // `?page=1` and `/insights/page/1` are both the bare index, and two URLs
    // for one page is what the canonical exists to stop.
    expect(rules.some((rule) => rule.destination === '/insights/page/1')).toBe(false)
    const first = rules.find((rule) => rule.source === '/insights/page/1')
    expect(first?.destination).toBe('/insights')
  })

  it('makes every rule permanent', () => {
    expect(rules.every((rule) => rule.permanent)).toBe(true)
  })
})
