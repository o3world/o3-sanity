import { caseStudyListing } from '@/content/documents'
import { buildListingRoute } from '@/lib/content-routes/build'

// The /work index, 9 per page (?page=N) — #43. Before this the nav's Work
// link 404'd: only `work/[slug]` existed.
const route = buildListingRoute(caseStudyListing)

export const generateMetadata = route.generateMetadata
export default route.Page
