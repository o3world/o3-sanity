import type { ReactNode } from 'react'

import type { CASE_STUDIES_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'
import type { Pagination } from '@o3/content-runtime/routes'
import { indexHref } from '@o3/content-runtime/routes/index-paths'

import { Pager } from '@o3/content-ui'

import { CaseStudyCard } from '@/components/cards/CaseStudyCard'

interface CaseStudyIndexViewProps {
  readonly items: NonNullable<CASE_STUDIES_PAGE_QUERY_RESULT>['items']
  readonly pagination: Pagination
  /**
   * The two slots the chrome document fills — the rendered `sectionsAbove` and
   * `sectionsBelow`. Rendered nodes rather than raw blocks, so this stays a
   * pure component with no draft-mode read in it (#348).
   */
  readonly above?: ReactNode
  readonly below?: ReactNode
}

/** `/work`, `/work/page/2` — the scheme the route reads back (#370). */
function pageHref(page: number): string {
  return indexHref('/work', { facets: {}, page })
}

/**
 * The /work index, built to the Work frame (`1634:1167`) — #43.
 *
 * ```
 * hero    2101:861    Interior Hero — eyebrow, 64px headline, standfirst under
 * grid    1634:1186   white, 128px vertical (96 at 402), 48px gap, 1248 cards
 * cta     2975:8738   the shared closer, the sphere and its fade strip
 * ```
 *
 * The grid instances the `Case Study Card` set (`2107:1094`–`1096`), and the
 * card follows the set. The homepage showcase renders the **same component**,
 * bound through this app's card table; its own band still draws cards as
 * frames (`1683:2661`), so it inherits the set's geometry until those frames
 * are read.
 *
 * ## A route that owns its feed, and a document that owns the rest
 *
 * #43 left this open and chose a dedicated route; #348 kept the route and gave
 * it a document for everything but the feed.
 *
 * The **feed stays the route's** for the reason it always was, now stated
 * precisely: a page is one path per document, so a paginated listing
 * cannot be a block an editor drops twice. `listingSection` projects pages by
 * `pageType` and could never have listed case studies anyway.
 *
 * The hero and the closer are **`sectionsAbove` and `sectionsBelow` on the
 * `collectionIndex` document**, so the copy is editable in Studio — which is
 * exactly the revisit this comment used to ask for. Nothing about the drawing
 * moved: `heroSection` at `variant: 'band'` renders the same `CollectionHero`
 * this file used to call directly.
 */
export function CaseStudyIndexView({ items, pagination, above, below }: CaseStudyIndexViewProps) {
  const { page, totalPages } = pagination

  return (
    <>
      {above}

      <div
        id="feed"
        className="px-gutter py-band-sm lg:py-band-md scroll-mt-20 bg-white lg:scroll-mt-[calc(var(--spacing-nav-offset)+96px)]"
      >
        {/*
         * The band the frame draws has no heading — the hero's job, and the
         * hero is an authored band now. But each card's narrative line is an
         * `h3` under that hero's `h1`, and a page that skips a level fails an
         * axe heading-order scan for a real reason: a screen reader's heading
         * list would offer no way into the stack at all. So the level exists
         * and is only unseen, exactly as it is on /insights.
         *
         * Found by the page story #348 added — the route had this gap before
         * the hero moved into a document, and nothing drew the whole page in
         * one place to catch it.
         */}
        <h2 className="sr-only">Case studies</h2>

        {/* Gap 48 at both widths — `2107:1094`–`1096`, and `2975:8428` at 402. */}
        <ul className="max-w-section mx-auto flex flex-col gap-12">
          {(items ?? []).map((item, index) => (
            <li key={item._id}>
              {/* The first card's photograph is 1248 × 550 in the first screen
                  of the index — the route's LCP element, and the only image on
                  it that is preloaded. */}
              <CaseStudyCard {...item} priority={index === 0} />
            </li>
          ))}
        </ul>

        {/* `#feed` for the same reason /insights carries it: the next page's
            reading starts at the feed's head, clear of the pinned pill. */}
        <Pager
          page={page}
          totalPages={totalPages}
          href={(target) => `${pageHref(target)}#feed`}
          className="max-w-section mx-auto mt-16"
        />
      </div>

      {below}
    </>
  )
}
