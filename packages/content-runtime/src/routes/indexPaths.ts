import { decodePathParam } from './decodePathParam'

import type { Facets } from './types'

/**
 * Where a collection index is: which page of it, filtered how.
 *
 * One shape, whether it came from a link the view drew or from the segments
 * Next handed the route.
 */
export interface IndexState {
  readonly facets: Facets
  readonly page: number
}

/**
 * The path a page of a collection index has.
 *
 * ```
 * /insights
 * /insights/page/3
 * /insights/category/design
 * /insights/category/design/page/2
 * ```
 *
 * **Segments, not a query string** (#370). A path is part of the route key, so
 * Next prerenders it and the CDN holds it; a search param is not, and a route
 * that reads one renders per request. That is the whole reason this file
 * exists, and it is why the two omissions below are rules rather than
 * tidiness: page one and an absent facet have no segment, so every page of the
 * collection has exactly one URL and the canonical has nothing to undo.
 *
 * Facet segments come out in the order the `facets` object spells them, and
 * the route files declare one nesting. Every index here filters on one thing,
 * so there is nothing to get wrong today; a second facet would make the two
 * orders a contract, and the entry's `facets` array is the one to take it
 * from.
 */
export function indexHref(prefix: string, state: IndexState): string {
  const segments: string[] = []
  for (const [name, value] of Object.entries(state.facets)) {
    if (!value) continue
    segments.push(name, encodeURIComponent(value))
  }
  if (state.page > 1) segments.push('page', String(state.page))
  return segments.length === 0 ? prefix : `${prefix}/${segments.join('/')}`
}

/**
 * The state a route's own segments describe, or `null` where they describe no
 * page at all.
 *
 * `null` is a 404: `page/0`, `page/two`, and `page/1` — which is the bare
 * index under a second URL. A path is a claim that a page exists, so an
 * impossible one is answered rather than rounded to page one.
 *
 * A facet the entry did not declare is ignored. The route's vocabulary is the
 * entry's.
 */
export function readIndexState(
  names: readonly string[],
  params: Record<string, string | string[] | undefined>,
): IndexState | null {
  const facets: Record<string, string | null> = {}
  for (const name of names) {
    const raw = params[name]
    const value = Array.isArray(raw) ? raw[0] : raw
    facets[name] = value ? decodePathParam(value) : null
  }

  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page
  if (rawPage === undefined) return { facets, page: 1 }
  if (!/^[1-9][0-9]*$/.test(rawPage)) return null
  const page = Number(rawPage)
  if (page === 1) return null
  return { facets, page }
}

/** One `has` clause of a Next redirect: this route, when this query is present. */
export interface QueryClause {
  readonly type: 'query'
  readonly key: string
  readonly value: string
}

/** A rule in the shape `next.config`'s `redirects()` returns. */
export interface IndexRedirect {
  readonly source: string
  readonly has?: QueryClause[]
  readonly destination: string
  readonly permanent: true
}

/**
 * Any page number but one. Page one is the bare index, and a rule that sent
 * `?page=1` to `/insights/page/1` would be minting the duplicate URL the move
 * to paths exists to remove.
 */
const PAGE_AFTER_FIRST = '(?<page>[2-9]|[1-9][0-9]+)'

/**
 * The rules that retire the query-string form of an index's URLs.
 *
 * Config rather than a runtime check, because the point of the move is that
 * the index route never reads a request. These run at the edge before anything
 * is rendered, so a bookmarked `?page=2` costs a 308 and nothing else.
 *
 * Every rule is permanent. A 302 would keep the query form indexed.
 *
 * Two things these rules do not do, both for the same reason: Next carries the
 * original query string onto the destination, and a rule whose destination
 * still matches its own source redirects forever.
 *
 * So the hop lands on `/insights/page/2?page=2` — inert, since the route reads
 * segments, and the canonical is the bare index either way. And `?page=1`,
 * `?page=0` and `?page=abc` are left alone rather than sent to the bare index,
 * which is a URL they would arrive at still carrying the parameter that matched.
 * Both would cost middleware on every request to a URL that is otherwise served
 * from the CDN, which is the thing this whole scheme is for.
 *
 * Two rules have no `has` at all — they retire the *path* spelling of page
 * one, which `readIndexState` refuses to serve. They come last so a query-form
 * URL is rewritten in one hop rather than two.
 *
 * The `has` clauses are ANDed and extra parameters are ignored, so the
 * all-facets rule has to come before the single-facet ones. Both indexes that
 * filter declare one facet; a second would want the cross-product of these
 * rules, which is a decision about how many URLs a collection should have
 * rather than a line of code.
 */
export function indexQueryRedirects(
  prefix: string,
  facetNames: readonly string[],
): IndexRedirect[] {
  const facetClauses = facetNames.map((name): QueryClause => ({
    type: 'query',
    key: name,
    value: `(?<${name}>[^&]+)`,
  }))
  const facetPath = facetNames.map((name) => `${name}/:${name}`).join('/')
  const pageClause: QueryClause = { type: 'query', key: 'page', value: PAGE_AFTER_FIRST }

  const rules: IndexRedirect[] = []

  if (facetNames.length > 0) {
    rules.push({
      source: prefix,
      has: [...facetClauses, pageClause],
      destination: `${prefix}/${facetPath}/page/:page`,
      permanent: true,
    })
    rules.push({
      source: prefix,
      has: facetClauses,
      destination: `${prefix}/${facetPath}`,
      permanent: true,
    })
  }

  rules.push({
    source: prefix,
    has: [pageClause],
    destination: `${prefix}/page/:page`,
    permanent: true,
  })

  rules.push({ source: `${prefix}/page/1`, destination: prefix, permanent: true })
  if (facetNames.length > 0) {
    rules.push({
      source: `${prefix}/${facetPath}/page/1`,
      destination: `${prefix}/${facetPath}`,
      permanent: true,
    })
  }

  return rules
}
