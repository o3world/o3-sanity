import { INSIGHT_SLUGS_QUERY } from '@o3/sanity/queries'
import { buildDetailRoute, publishedSlugs } from '@o3/content-runtime/routes'

import { insight } from '@/content/documents'

const route = buildDetailRoute(insight)

// Detail content depends on this URL's slug before it can render. Keep the
// existing blocking navigation contract until partial prefetching is adopted
// with an intentional insight shell.
export const instant = false

export async function generateStaticParams() {
  return (await publishedSlugs(INSIGHT_SLUGS_QUERY)).map((slug) => ({ slug }))
}

export const generateMetadata = route.generateMetadata
export default route.Page
