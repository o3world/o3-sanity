import { CASE_STUDY_SLUGS_QUERY } from '@o3/sanity/queries'
import { buildDetailRoute, publishedSlugs } from '@o3/content-runtime/routes'

import { caseStudy } from '@/content/documents'

const route = buildDetailRoute(caseStudy)

export async function generateStaticParams() {
  return (await publishedSlugs(CASE_STUDY_SLUGS_QUERY)).map((slug) => ({ slug }))
}

export const generateMetadata = route.generateMetadata
export default route.Page
