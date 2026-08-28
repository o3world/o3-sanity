import { buildIndexRoute } from '@o3/content-runtime/routes'

import { insightIndex } from '@/content/documents'

// Page N of one category.
const route = buildIndexRoute(insightIndex)

export const generateMetadata = route.generateMetadata
export const generateStaticParams = route.facetPageParams
export default route.Page
