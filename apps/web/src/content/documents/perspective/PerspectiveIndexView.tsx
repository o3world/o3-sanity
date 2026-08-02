import Link from 'next/link'

import { ArrowIcon, Button, CollectionHero } from '@o3/ui'
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
 * The paginated /perspectives index — **provisional (#49)**.
 *
 * This route has no canonical frame. 272 migrated articles sit behind a
 * top-level nav link and nobody drew the index; #34 found only a
 * Wireframes-canvas capture of the old HTML prototype (`1065:4601`), which is
 * generation-1 reference, not canonical. That makes it the largest coverage
 * gap on map #33, and the map's coverage rule applies: compose from blocks
 * that **are** drawn, and mark the result provisional.
 *
 * ## What each element traces to
 *
 * ```
 * hero      1634:1181   CollectionHero, the Work index's ink-warm band
 * band      1683:2467   96px 0, bone #F0F0F0     ← the Home "Blog" row
 *           1924:5388   the same band on About, unchanged
 * card      1734:1729   394.67 wide, gap 24      ← PerspectiveCard (#42)
 * grid gap  1683:2467   32px between cards; 3 × 394.67 + 2 × 32 = 1248 exactly
 * stack     1814:1738   one column at 402, cards 48px apart
 * pager     136:754     Button / Solid, `Show right icon`, light fill
 *           1683:2490   the 13px tracked meta step for the counter
 * ```
 *
 * The 1248 arithmetic is the reason this is a plain three-up grid rather than
 * a guess: `max-w-section` is 1248, and three of the frame's own cards at the
 * frame's own 32px gap fill it to the pixel. Nothing was resized to fit.
 *
 * ## The three things that trace to nothing
 *
 * Stated here rather than buried, because "provisional" is only useful if it
 * names what is unsourced:
 *
 * 1. **The hero standfirst.** No frame writes one for this route. The
 *    headline is not invented — it is the Blog row's own line (`1683:2469`) —
 *    and the eyebrow is the collection's name, the same treatment `WORK` gets
 *    on `1634:1183`. The standfirst is new copy.
 * 2. **The row gap above 402.** The 48px comes from `1814:1738`, where the
 *    mobile Blog band stacks its cards. No 1440 frame ever stacks this card,
 *    so the desktop row gap is that value carried up rather than read.
 * 3. **The pager.** Nothing in the file paginates anything. The parts are
 *    canonical — `Button / Solid` with the arrow, the card's meta type step
 *    for the counter — but the arrangement is not. `Show left icon` is a real
 *    boolean on the Figma set, so the reversed arrow on Previous is the set's
 *    own affordance rather than a new one.
 *
 * **No category filter.** 11 categories migrated, and no frame anywhere draws
 * a filter UI — not a chip row, not a select, not a sidebar. Building one
 * would be inventing a control, which is the trade #25's working agreement 3
 * declines. Raised on #49 instead.
 *
 * A real frame changes this file and `collectionIndex.tsx`'s marker, and
 * nothing else.
 */
export function PerspectiveIndexView({ items, pagination }: PerspectiveIndexViewProps) {
  const { page, totalPages } = pagination

  return (
    <>
      <CollectionHero
        eyebrow="Perspectives"
        heading="The thinking behind the work."
        subheading="Notes from inside the work. What we tried, what broke, and what we'd do again."
      />

      {/* The Blog band: bone, 96px 0, inset by the gutter. Unlike the Home and
          About rows this one does not bleed past the right edge — there is
          nothing to scroll to, so the overhang would promise a gesture the
          page cannot honour. */}
      <div className="px-gutter py-band-sm bg-bone">
        {/*
         * One column below `lg`, three at `lg` — the two frame widths and
         * nothing between them (ADR 0006: composition switches at `lg`, size
         * interpolates). A `md:grid-cols-2` would be a third composition no
         * frame draws.
         */}
        <ul className="max-w-section mx-auto grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-3">
          {(items ?? []).map((item) => (
            <li key={item._id}>
              <PerspectiveCard {...item} />
            </li>
          ))}
        </ul>

        {totalPages > 1 ? (
          <nav
            aria-label="Pagination"
            /* 48px clear of the grid — the Blog band's own gap (`1683:2467`),
               not a new step. */
            className="max-w-section mx-auto mt-12 grid grid-cols-3 items-center gap-4"
          >
            <div className="justify-self-start">
              {page > 1 ? (
                <Button asChild variant="light">
                  <Link href={pageHref(page - 1)} rel="prev">
                    {/* `Show left icon` on `Button / Solid` — the same glyph,
                        reversed, which is how the set draws a back arrow. */}
                    <ArrowIcon className="rotate-180" />
                    Previous
                  </Link>
                </Button>
              ) : null}
            </div>

            {/* One interpolated string, not three children: React splits
                adjacent expressions with comment markers, which puts them
                inside the accessible name a screen reader reads out. */}
            <p className="text-meta text-fg-muted justify-self-center text-center uppercase">
              {`Page ${page} of ${totalPages}`}
            </p>

            <div className="justify-self-end">
              {page < totalPages ? (
                <Button asChild variant="light">
                  <Link href={pageHref(page + 1)} rel="next">
                    Next
                    <ArrowIcon />
                  </Link>
                </Button>
              ) : null}
            </div>
          </nav>
        ) : null}
      </div>
    </>
  )
}
