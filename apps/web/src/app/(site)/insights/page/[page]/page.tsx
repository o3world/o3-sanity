import { buildIndexRoute } from '@o3/content-runtime/routes'

import { insightIndex } from '@/content/documents'

// Page N of the unfiltered feed. Page 1 is `/insights`, and this route 404s it.
const route = buildIndexRoute(insightIndex)

export const generateMetadata = route.generateMetadata
export const generateStaticParams = route.pageParams
export default route.Page
