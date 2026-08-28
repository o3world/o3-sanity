import { buildIndexRoute } from '@o3/content-runtime/routes'

import { caseStudyIndex } from '@/content/documents'

// The /work index, 9 per page — #43, page 1, with `page/[page]` beside it.
// Before this the nav's Work
// link 404'd: only `work/[slug]` existed.
const route = buildIndexRoute(caseStudyIndex)

export const generateMetadata = route.generateMetadata
export default route.Page
