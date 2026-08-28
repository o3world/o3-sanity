import { buildIndexRoute } from '@o3/content-runtime/routes'

import { caseStudyIndex } from '@/content/documents'

// The case-study index, 9 per page — page 1, with `page/[page]` beside it.
// The directory name is this
// brand's prefix — `/case-studies`, where o3 serves `/work` (ADR 0028) — and it
// has to agree with `brandConfig().collections.caseStudy.prefix`, which is what
// every link and canonical is built from. `src/brandBinding.test.ts` asserts so.
const route = buildIndexRoute(caseStudyIndex)

export const generateMetadata = route.generateMetadata
export default route.Page
