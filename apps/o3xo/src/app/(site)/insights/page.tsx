import { buildIndexRoute } from '@o3/content-runtime/routes'

import { insightIndex } from '@/content/documents'

// Paginated /insights index, 12 per page (?page=N).
const route = buildIndexRoute(insightIndex)

export const generateMetadata = route.generateMetadata
export default route.Page
