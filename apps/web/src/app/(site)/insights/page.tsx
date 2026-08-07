import { insightIndex } from '@/content/documents'
import { buildIndexRoute } from '@/lib/content-routes/build'

// Paginated /insights index, 12 per page (?page=N).
const route = buildIndexRoute(insightIndex)

export const generateMetadata = route.generateMetadata
export default route.Page
