import { CollectionHero } from '@o3/ui'
import type { CASE_STUDIES_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'
import type { Pagination } from '@o3/content-runtime/routes'

import { CtaSection, Pager } from '@o3/content-ui'

import { CaseStudyCard } from '@/components/cards/CaseStudyCard'

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
      {/* `2101:861` — the frame's own instance of the set (#308 q1). */}
      <CollectionHero
        variant="interior"
        eyebrow="Our work"
        heading="Strategy, Design and Technology working together."
        subheading="Not the deliverable. Here's what that looks like across the work."
      />

      <div className="px-gutter py-band-sm lg:py-band-md bg-white">
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

        <Pager
          page={page}
          totalPages={totalPages}
          href={pageHref}
          className="max-w-section mx-auto mt-16"
        />
      </div>

      {/*
       * The closer the frame draws at both widths (`2975:8738`, `2975:8751`) —
       * the shared band, route-owned the way /insights' is, because this route
       * has no document to seed one on.
       *
       * **`orbs`, and the frame is why.** Its band is a full-bleed raster over
       * a native 172px `--gradient-ink-fade` strip (`2975:8745`), and the strip
       * exists only in the sphere's composition — the raster is a video capture
       * of that sphere, cursor and all. So this is Home's closer pasted, not a
       * photograph, and it is drawn rather than exported for the reason
       * `CtaSection` gives.
       *
       * The desktop body is the copy (#308 q2); the 402 frame carries Home's
       * mobile body, which the same ruling declines to copy. The button points
       * at /contact: the frame's "View our work" is the paste's, and on the
       * work index it is a link to the page it is on.
       */}
      <CtaSection
        heading="Let’s get started on your next big thing."
        body="We partner with businesses like yours to build experiences that matter. If you’re ready, we’re ready."
        button={{
          _type: 'button',
          label: 'Get in touch',
          href: '/contact',
          target: null,
        }}
        decoration="orbs"
      />
    </>
  )
}
