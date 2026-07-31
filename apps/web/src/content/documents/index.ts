import type { AnyCatchAllEntry } from '@/lib/content-routes/types'

import { caseStudy } from './caseStudy/entry'
import { home, page } from './page/entry'
import { perspective } from './perspective/entry'
import { perspectiveListing } from './perspective/listing'

/**
 * Catch-all entries serve `apps/web/src/app/(site)/[...segments]/page.tsx`,
 * dispatched via `PAGE_QUERY` matching `slug.current == segments.join('/')`.
 * `page` is the only member today; the list keeps the multi-type dispatch
 * seam (`_type` narrowing in `buildCatchAllRoute`) that vtx proved out.
 *
 * Annotated with the erased entry shape (not `as const`): entries carry
 * literal query types, and `BaseEntry<Q>` is invariant in `Q`, so a
 * heterogeneous tuple's element union would defeat the route builders'
 * generics. See the Erased design note in content-routes/types.ts.
 */
export const CATCH_ALL_TYPES: readonly AnyCatchAllEntry[] = [page]

// Re-export named entries so route files can import a single entry by name.
export { caseStudy, home, page, perspective, perspectiveListing }
