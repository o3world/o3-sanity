import Link from 'next/link'

import { DisplayHeading, Eyebrow } from '@o3/ui'
import type { PERSPECTIVES_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { PerspectiveCard } from './PerspectiveCard'
import type { Pagination } from '@/lib/content-routes/types'

interface PerspectivesListingViewProps {
  readonly items: NonNullable<PERSPECTIVES_PAGE_QUERY_RESULT>['items']
  readonly pagination: Pagination
}

function pageHref(page: number): string {
  return page <= 1 ? '/perspectives' : `/perspectives?page=${page}`
}

/** The paginated /perspectives index. */
export function PerspectivesListingView({ items, pagination }: PerspectivesListingViewProps) {
  const { page, totalPages } = pagination
  return (
    <div className="bg-bone">
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-40">
        <header className="flex flex-col gap-4">
          <Eyebrow>Perspectives</Eyebrow>
          <DisplayHeading>The thinking behind the work.</DisplayHeading>
        </header>
        <ul className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <li key={item._id}>
              <PerspectiveCard {...item} />
            </li>
          ))}
        </ul>
        {totalPages > 1 ? (
          <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-4">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} className="text-fg text-sm font-medium">
                ← Previous
              </Link>
            ) : null}
            <p className="text-fg-subtle text-sm">
              Page {page} of {totalPages}
            </p>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} className="text-fg text-sm font-medium">
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </div>
  )
}
