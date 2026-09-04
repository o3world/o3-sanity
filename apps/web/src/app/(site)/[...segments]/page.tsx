import { PAGE_QUERY, PAGE_SLUGS_QUERY } from '@o3/sanity/queries'
import { buildCatchAllRoute, publishedSlugs } from '@o3/content-runtime/routes'

import { CATCH_ALL_TYPES } from '@/content/documents'

const route = buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY)

// This route resolves URL segments before it can render content. Keep the
// existing blocking navigation contract until partial prefetching is adopted
// and the route has an intentional shell for unknown Sanity pages.
export const instant = false

/**
 * Known slugs prerender; an unknown one renders on demand and 404s if no
 * document matches it. The homepage is `buildSingletonRoute`'s, not this
 * route's, so its slug is dropped here.
 */
export async function generateStaticParams() {
  return (await publishedSlugs(PAGE_SLUGS_QUERY))
    .filter((slug) => slug !== 'index')
    .map((slug) => ({ segments: slug.split('/') }))
}

export const generateMetadata = route.generateMetadata
export default route.Page
