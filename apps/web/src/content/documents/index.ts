import type { AnyCatchAllEntry } from '@o3/content-runtime/routes'

import { caseStudy } from './caseStudy/entry'
import { caseStudyIndex } from './caseStudy/collectionIndex'
import { home, page } from './page/entry'
import { insight } from './insight/entry'
import { insightIndex } from './insight/collectionIndex'

/**
 * Catch-all entries serve `apps/web/src/app/(site)/[...segments]/page.tsx`,
 * dispatched via `PAGE_QUERY` matching `slug.current == segments.join('/')`.
 * `page` is the only member today; the list keeps the multi-type dispatch
 * seam (`_type` narrowing in `buildCatchAllRoute`) that vtx proved out.
 *
 * Annotated with the erased entry shape (not `as const`): entries carry
 * literal query types, and `BaseEntry<Q>` is invariant in `Q`, so a
 * heterogeneous tuple's element union would defeat the route builders'
 * generics. See the Erased design note in `@o3/content-runtime/routes`.
 */
export const CATCH_ALL_TYPES: readonly AnyCatchAllEntry[] = [page]

// Re-export named entries so route files can import a single entry by name.
export { caseStudy, caseStudyIndex, home, page, insight, insightIndex }
