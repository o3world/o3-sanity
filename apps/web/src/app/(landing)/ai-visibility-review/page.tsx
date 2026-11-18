import { buildSingletonRoute } from '@o3/content-runtime/routes'

import { aiVisibilityReview } from '@/content/documents'

// A static segment, so it wins over `(site)/[...path]`; `RESERVED_PAGE_SLUGS`
// keeps a page from being authored at the same URL.
const route = buildSingletonRoute(aiVisibilityReview)

export const generateMetadata = route.generateMetadata
export default route.Page
