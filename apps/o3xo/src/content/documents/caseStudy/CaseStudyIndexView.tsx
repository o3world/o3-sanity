import { CollectionHero, Reveal } from '@o3/ui'
import { brandConfig } from '@o3/sanity/brand'
import type { CASE_STUDIES_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'
import type { Pagination } from '@o3/content-runtime/routes'
import { indexHref } from '@o3/content-runtime/routes/index-paths'

import { Pager } from '@o3/content-ui'

import { CaseStudyCard } from './CaseStudyCard'

const { title: collectionTitle, prefix } = brandConfig().collections.caseStudy

interface CaseStudyIndexViewProps {
  readonly items: NonNullable<CASE_STUDIES_PAGE_QUERY_RESULT>['items']
  readonly pagination: Pagination
}

/** `/case-studies`, `/case-studies/page/2` — the route's own scheme (#370). */
function pageHref(page: number): string {
  return indexHref(prefix, { facets: {}, page })
}

/**
 * The case-study index — the kit's cards, three across.
 *
 * ```
 * hero    1634:1181   O3's Work hero: ink-warm band, eyebrow + headline
 * grid    4404:3398   the kit's Case Study Group — 3 × 379 cards, 32 apart
 * ```
 *
 * Two frames from two files, because the kit draws the cards and their row but
 * no case-studies page to put them on. The hero is O3's until O3XO's own copy
 * and a frame for it exist, which is what the route entry's provisional marker
 * says; the cards below it are O3XO's own (#245).
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
        {/* One up until the card's own 379 fits twice, then three across as
         * the kit's group draws them. 32px apart at every width — the group's
         * only gap, and the kit draws no narrower one. */}
        <ul className="max-w-section mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <li key={item._id}>
              {/* NO STAGGER, because this grid is two up as well as three
                  (`sm:grid-cols-2 lg:grid-cols-3`). A per-column delay is one
                  number, and one number cannot be right for both counts — at the
                  width it does not match, the delays land across rows instead of
                  along one and the entrance reads as a scatter. The feeds that
                  stagger go straight from one column to three. */}
              <Reveal>
                <CaseStudyCard {...item} />
              </Reveal>
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
