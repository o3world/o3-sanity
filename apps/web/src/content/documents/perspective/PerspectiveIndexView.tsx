import Link from 'next/link'

import { CollectionHero } from '@o3/ui'
import type { PERSPECTIVES_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { PerspectiveCard } from './PerspectiveCard'
import type { Pagination } from '@/lib/content-routes/types'

interface PerspectiveIndexViewProps {
  readonly items: NonNullable<PERSPECTIVES_PAGE_QUERY_RESULT>['items']
  readonly pagination: Pagination
}

function pageHref(page: number): string {
  return page <= 1 ? '/perspectives' : `/perspectives?page=${page}`
}

/**
 * The paginated /perspectives index.
 *
 * **This route has no canonical frame** (#49) — the content it lists is fully
 * migrated, but nobody drew the index. Rather than invent a composition, it
 * borrows two that are drawn: the Work index's hero band (`1634:1181`, via
 * `CollectionHero`) and the Home Blog row's card (`1734:1729`). The heading is
 * the Blog row's own copy.
 *
 * That keeps the page inside the design language rather than beside it, and
 * makes it cheap to replace: a real frame changes this file only.
 */
export function PerspectiveIndexView({ items, pagination }: PerspectiveIndexViewProps) {
  const { page, totalPages } = pagination

  return (
    <>
      <CollectionHero
        eyebrow="Perspectives"
        heading="The thinking behind the work."
        subheading="Essays and field notes from the team — what we are seeing, and what we think it means."
      />

      <div className="px-gutter py-band-sm bg-bone">
        <ul className="max-w-section mx-auto grid grid-cols-1 gap-x-8 gap-y-16 md:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <li key={item._id}>
              <PerspectiveCard {...item} />
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
