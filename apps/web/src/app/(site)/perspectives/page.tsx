import { perspectiveListing } from '@/content/documents'
import { buildListingRoute } from '@/lib/content-routes/build'

// Paginated /perspectives index, 12 per page (?page=N).
const route = buildListingRoute(perspectiveListing)

export const generateMetadata = route.generateMetadata
export default route.Page
