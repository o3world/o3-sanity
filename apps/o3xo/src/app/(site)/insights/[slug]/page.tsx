import { INSIGHT_SLUGS_QUERY } from '@o3/sanity/queries'
import { buildDetailRoute, publishedSlugs } from '@o3/content-runtime/routes'

import { insight } from '@/content/documents'

const route = buildDetailRoute(insight)

export async function generateStaticParams() {
  return (await publishedSlugs(INSIGHT_SLUGS_QUERY)).map((slug) => ({ slug }))
}

export const generateMetadata = route.generateMetadata
export default route.Page
