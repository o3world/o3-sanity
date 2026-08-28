import { indexQueryRedirects, type IndexRedirect } from '@o3/content-runtime/routes/index-paths'
import { collectionPrefixes, type Brand } from '@o3/sanity/brand'

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
 * **The brand is a parameter** because `next.config.ts` is what imports this
 * and also what sets `NEXT_PUBLIC_BRAND`, so nothing it loads can read the
 * brand yet — and this app is not the default one.
 *
 * `routes/index-paths` rather than the `routes` barrel: the barrel drags the
 * route builders and their server runtime in with it, which is not something a
 * config file should be loading.
 */
export function indexRedirects(brand: Brand): IndexRedirect[] {
  const { insight, caseStudy } = collectionPrefixes(brand)
  return [...indexQueryRedirects(insight, ['category']), ...indexQueryRedirects(caseStudy, [])]
}
