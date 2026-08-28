import { buildIndexRoute } from '@o3/content-runtime/routes'

import { insightIndex } from '@/content/documents'

// The /insights index, 12 per page. Page 1 and the unfiltered feed; the
// other pages and the category cuts are path segments beside this file.
const route = buildIndexRoute(insightIndex)

export const generateMetadata = route.generateMetadata
export default route.Page
