import Link from 'next/link'

import { CollectionHero } from '@o3/ui'
import type { CASE_STUDIES_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CaseStudyCard } from './CaseStudyCard'
import type { Pagination } from '@/lib/content-routes/types'

interface CaseStudyIndexViewProps {
  readonly items: NonNullable<CASE_STUDIES_PAGE_QUERY_RESULT>['items']
  readonly pagination: Pagination
}

function pageHref(page: number): string {
  return page <= 1 ? '/work' : `/work?page=${page}`
}

/**
 * The /work index, built to the Work frame (`1634:1167`) — #43.
 *
 * ```
 * hero    1634:1181   ink-warm band, eyebrow + 48px headline + 24px standfirst
 * grid    1634:1186   white, 96px vertical, 64px gap, 1248 × 556 cards
 * ```
 *
 * The cards are the **same component** the homepage showcase renders — the
 * frame draws identical geometry in both places (`1925:5642` against
 * `1883:3555`), so a second card here would be a copy waiting to drift.
 *
 * ## Why a route and not a page document
 *
 * #43 left this open: a `page` with a listing block, or a dedicated route like
 * `/insights`. This is a **dedicated route**, for two reasons.
 *
 * The existing `listingSection` lists **pages by `pageType`**, so it cannot
 * project case studies at all — serving this through a page document would
 * mean a new block whose only job is to hard-code one collection, which is
 * what a route already is.
 *
 * And `/insights` is already a dedicated route on exactly this shape.
 * Splitting the two collections across two mechanisms would leave the next
 * person guessing which one a collection index uses.
 *
 * The cost is that the hero copy is not editable in Studio. That is a real
 * cost and it is the reason to revisit: the moment someone wants to reorder or
 * curate this index, it wants a document. Until then the frame supplies the
 * copy and the collection supplies the cards.
 */
export function CaseStudyIndexView({ items, pagination }: CaseStudyIndexViewProps) {
  const { page, totalPages } = pagination

  return (
    <>
      <CollectionHero
        eyebrow="Work"
        heading="The work, framed around the second problem."
        subheading="We lead with the deeper problem we found — not the deliverable. Here's what that looks like across the work."
      />

      <div className="px-gutter py-band-sm bg-white">
        {/* Gap 24 at 402 (`1925:5733`), 64 at 1440 (`1634:1186`). */}
        <ul className="max-w-section mx-auto flex flex-col gap-6 lg:gap-16">
          {(items ?? []).map((item, index) => (
            <li key={item._id}>
              {/* The first card's photograph is 1248 × 556 in the first screen
                  of the index — the route's LCP element, and the only image on
                  it that is preloaded. */}
              <CaseStudyCard {...item} priority={index === 0} />
            </li>
          ))}
        </ul>

        {totalPages > 1 ? (
          <nav
            aria-label="Pagination"
            className="max-w-section mx-auto mt-16 flex items-center justify-center gap-6"
          >
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="text-fg hover:text-brand text-button">
                ← Previous
              </Link>
            ) : null}
            <p className="text-fg-muted text-button">
              Page {page} of {totalPages}
            </p>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="text-fg hover:text-brand text-button">
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </>
  )
}
