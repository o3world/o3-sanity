import { PAGE_QUERY, PAGE_SLUGS_QUERY } from '@o3/sanity/queries'

import { CATCH_ALL_TYPES } from '@/content/documents'
import { buildCatchAllRoute } from '@/lib/content-routes/build'
import { sanityFetch } from '@/sanity/live'

// Known slugs are pre-rendered at build time; unknown ones render on demand
// (ISR) and 404 if no document matches. Declared explicitly (it is the Next
// default) so the behavior is self-documenting next to generateStaticParams.
export const dynamicParams = true

const route = buildCatchAllRoute(CATCH_ALL_TYPES, PAGE_QUERY)

export async function generateStaticParams() {
  try {
    const { data: slugs } = await sanityFetch({
      query: PAGE_SLUGS_QUERY,
      perspective: 'published',
      stega: false,
    })
    return ((slugs ?? []) as Array<string | null>)
      .filter((slug): slug is string => typeof slug === 'string' && slug !== '' && slug !== 'index')
      .map((slug) => ({ segments: slug.split('/') }))
  } catch {
    // Build proceeds without pre-rendered params when the dataset is
    // unreachable; every route still renders on demand.
    return []
  }
}

export const generateMetadata = route.generateMetadata
export default route.Page
