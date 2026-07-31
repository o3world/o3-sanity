import { CASE_STUDY_SLUGS_QUERY } from '@o3/sanity/queries'

import { caseStudy } from '@/content/documents'
import { buildDetailRoute } from '@/lib/content-routes/build'
import { sanityFetch } from '@/sanity/live'

export const dynamicParams = true

const route = buildDetailRoute(caseStudy)

export async function generateStaticParams() {
  try {
    const { data: slugs } = await sanityFetch({
      query: CASE_STUDY_SLUGS_QUERY,
      perspective: 'published',
      stega: false,
    })
    return ((slugs ?? []) as Array<string | null>)
      .filter((slug): slug is string => typeof slug === 'string' && slug !== '')
      .map((slug) => ({ slug }))
  } catch {
    return []
  }
}

export const generateMetadata = route.generateMetadata
export default route.Page
