import { buildIndexRoute } from '@o3/content-runtime/routes'

import { insightIndex } from '@/content/documents'

// The feed cut to one category — page 1.
const route = buildIndexRoute(insightIndex)

export const generateMetadata = route.generateMetadata
export const generateStaticParams = route.facetParams
export default route.Page
