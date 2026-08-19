import { CollectionHero } from '@o3/ui'
import { brandConfig } from '@o3/sanity/brand'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import type { CASE_STUDIES_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'
import type { Pagination } from '@o3/content-runtime/routes'

import { CaseStudyCard } from '@o3/content-ui/cards'
import { Pager } from '@o3/content-ui'

const { title: collectionTitle } = brandConfig().collections.caseStudy
const prefix = COLLECTION_PREFIXES.caseStudy

interface CaseStudyIndexViewProps {
  readonly items: NonNullable<CASE_STUDIES_PAGE_QUERY_RESULT>['items']
  readonly pagination: Pagination
}

function pageHref(page: number): string {
  return page <= 1 ? prefix : `${prefix}?page=${page}`
}

/**
 * The case-study index, composed as O3's Work frame composes it (`1634:1167`).
 *
 * ```
 * hero    1634:1181   ink-warm band, eyebrow + 48px headline
 * grid    1634:1186   white, 96px vertical, 64px gap, 1248 × 556 cards
 * ```
 *
 * Borrowing that composition is the adaptation experiment (ADR 0028 addendum),
 * so the geometry here is not a copy waiting to diverge — it is the hypothesis
 * under test. What it cannot borrow is the copy: O3's hero says something about
 * O3's practice. This index has no document (see apps/web's copy of this file
 * for why a route rather than a page), so its heading is a placeholder in code
 * and the route entry is marked provisional until O3XO's own content and the
 * delta evaluation settle it.
 *
 * The prefix and the eyebrow come from brand config, which is also what keeps
 * o3's answers (`/work`, and `Work` as the name) out of this file — see
 * `src/brandBinding.test.ts`.
 */
export function CaseStudyIndexView({ items, pagination }: CaseStudyIndexViewProps) {
  const { page, totalPages } = pagination

  return (
    <>
      <CollectionHero eyebrow={collectionTitle} heading={`${collectionTitle}.`} />

      <div className="px-gutter py-band-sm bg-white">
        {/* Gap 24 at 402 (`1925:5733`), 64 at 1440 (`1634:1186`). */}
        <ul className="max-w-section mx-auto flex flex-col gap-6 lg:gap-16">
          {(items ?? []).map((item) => (
            <li key={item._id}>
              <CaseStudyCard {...item} />
            </li>
          ))}
        </ul>

        <Pager
          page={page}
          totalPages={totalPages}
          href={pageHref}
          className="max-w-section mx-auto mt-16"
        />
      </div>
    </>
  )
}
