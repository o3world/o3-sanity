import { buildSingletonRoute } from '@o3/content-runtime/routes'

import { home } from '@/content/documents'

// The homepage renders the `page` document whose slug is "index" through the
// singleton builder — same renderer + cache-tag wiring as the catch-all.
const route = buildSingletonRoute(home)

export const generateMetadata = route.generateMetadata
export default route.Page
