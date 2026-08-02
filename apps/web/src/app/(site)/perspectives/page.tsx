import { perspectiveIndex } from '@/content/documents'
import { buildIndexRoute } from '@/lib/content-routes/build'

// Paginated /perspectives index, 12 per page (?page=N).
const route = buildIndexRoute(perspectiveIndex)

export const generateMetadata = route.generateMetadata
export default route.Page
