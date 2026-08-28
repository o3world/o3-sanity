import { buildIndexRoute } from '@o3/content-runtime/routes'

import { caseStudyIndex } from '@/content/documents'

// Page N of the case-study index. Page 1 is `/case-studies`, and this route 404s it.
const route = buildIndexRoute(caseStudyIndex)

export const generateMetadata = route.generateMetadata
export const generateStaticParams = route.pageParams
export default route.Page
