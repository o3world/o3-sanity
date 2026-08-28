import { indexQueryRedirects, type IndexRedirect } from '@o3/content-runtime/routes/index-paths'
import { collectionPrefixes } from '@o3/sanity/brand'

/**
 * The rules that retire `?page=` and `?category=` on this site's collection
 * indexes (#370).
 *
 * Config rather than a check inside the route, which is the point: an index
 * that reads a request cannot be a static shell. A bookmarked or crawled
 * query-string URL costs a 308 at the edge and nothing else.
 *
 * The facet list mirrors each entry's own `facets` — insight filters on
 * category, caseStudy on nothing — and the prefixes are brand config's, the
 * same values every canonical and link is built from.
 *
 * `routes/index-paths` rather than the `routes` barrel: the barrel drags the
 * route builders and their server runtime in with it, which is not something a
 * config file should be loading. This app runs as the default brand, so it
 * names none; o3xo's copy of this file passes its own.
 */
export function indexRedirects(): IndexRedirect[] {
  const { insight, caseStudy } = collectionPrefixes()
  return [...indexQueryRedirects(insight, ['category']), ...indexQueryRedirects(caseStudy, [])]
}
