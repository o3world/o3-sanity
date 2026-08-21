import { INSIGHT_SLUGS_QUERY } from '@o3/sanity/queries'

import { insight } from '@/content/documents'
import { buildDetailRoute } from '@/lib/content-routes/build'
import { publishedSlugs } from '@/lib/content-routes/staticParams'

const route = buildDetailRoute(insight)

export async function generateStaticParams() {
  return (await publishedSlugs(INSIGHT_SLUGS_QUERY)).map((slug) => ({ slug }))
}

export const generateMetadata = route.generateMetadata
export default route.Page
