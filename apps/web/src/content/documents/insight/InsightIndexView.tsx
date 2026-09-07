import type { ReactNode } from 'react'
import Link from 'next/link'

import { FilterChip } from '@o3/ui'
import type { INSIGHTS_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'
import type { Pagination } from '@o3/content-runtime/routes'
import { indexHref } from '@o3/content-runtime/routes/index-paths'

import { InsightCard } from '@o3/content-ui/cards'
import { Pager } from '@o3/content-ui/pager'
import { RevealSequence } from '@o3/ui'

type IndexData = NonNullable<INSIGHTS_PAGE_QUERY_RESULT>

interface InsightIndexViewProps {
  readonly resultsKey?: string
  readonly items: IndexData['items']
  /** Every category with an article to show — the filter bar's options. */
  readonly categories: IndexData['categories']
  /** The category slug the URL asked for, or null on the unfiltered index. */
  readonly category: string | null
  readonly pagination: Pagination
  /**
   * THE TWO SLOTS the chrome document fills — the rendered `sectionsAbove` and
   * `sectionsBelow`, in the Web Components sense the naming rules mean by the
   * word: a rendered area this component's parent fills.
   *
   * Rendered nodes rather than raw blocks so this stays a pure component with
   * no draft-mode read in it. The route fills them with `Blocks`, which
   * resolves draft mode and keeps the Presentation path; the Storybook mockup
   * fills them with the server renderer, which is the only way a story can
   * draw a band at all.
   */
  readonly above?: ReactNode
  readonly below?: ReactNode
}

/**
 * `/insights#feed` and `/insights/category/design/page/2#feed` — one builder
 * over the route's own scheme (#370), so a chip, a pager link and the route
 * cannot disagree about how this index spells its state. A chip resets the
 * page (a new filter has no page 4 in common with the old one); the pager
 * keeps the filter.
 *
 * Every link this bar and this pager draw lands the reader at the head of the
 * feed, so `#feed` belongs to the builder rather than to each call. The band
 * carries the id and the `scroll-mt` clearance; the hash is what makes the
 * landing work with no JS in it.
 */
function insightsHref({
  category,
  page = 1,
}: { category?: string | null; page?: number } = {}): string {
  return `${indexHref('/insights', { facets: { category: category ?? null }, page })}#feed`
}

/**
 * The /insights index: authored bands, the feed, authored bands (#347).
 *
 * **What this file still owns is the feed and only the feed** — the filter
 * bar, the card grid and the pager, drawn to the frame #61 commissioned
 * (`2336:4310`) and its 402 companion (`2975:8499`):
 *
 * ```
 * band      2337:4485   bone #F1F0EC, 128px 96px, gap 48
 *   filters 2337:4486   chip row, gap 10, All + one per category
 *   grid    2337:4492   1249 wide, wrap, gap 64 × 32 — three 395px cards
 *   card    2337:4493   the same InsightCard the Home row draws
 * ```
 *
 * At 402 the chip row scrolls sideways (`2975:8656`) and the grid is one
 * 370px column 64 apart (`2975:8663`).
 *
 * The hero (`2336:4477`) and the closer (`2336:4351`) are **no longer here**.
 * They are `heroSection` and `ctaSection` blocks on the `collectionIndex`
 * document, which is what makes them an editor's to change — and the hero the
 * block draws at `variant: 'band'` is the same `CollectionHero` this file used
 * to call directly, so nothing about the drawing moved with the copy.
 *
 * ## The filter is the point of the frame
 *
 * #49 declined to invent a category filter and #61 asked the frame to settle
 * it. It did: `2337:4486` draws All plus five categories, and the labels are
 * five real migrated categories (AI, Design, Technology, 1682 Conference, Life
 * at O3) rather than sample words — so the control filters on `category`, and
 * the chips come from the collection instead of from a hand-kept list here.
 *
 * The initial result is server-rendered at `/insights/category/design` (#370),
 * keeping filtered indexes linkable and crawlable. Hydrated filter changes
 * use the downloaded card catalog and keep that same URL scheme.
 *
 * Two divergences from the frame worth stating rather than burying:
 *
 * 1. **The frame draws five chips; this draws every category that has an
 *    article.** A curated subset would need a field marking a category as
 *    featured, and no schema says that. The bar wraps at 1440 and scrolls at
 *    402, so a sixth category costs the layout nothing at either width.
 * 2. **The frame has no pager**, because nine cards fit its canvas. 273
 *    articles do not, so the pager stays, at the same 12 a page. The drawing
 *    it follows is the O3XO kit's — the one file either brand has that draws
 *    this control — and `Pager` is shared for that reason.
 *
 * The card is untouched: the frame's cards are 395 wide with a 24px gap, a
 * square image under the ink veil, and a 13px meta line over a 24px title —
 * `InsightCard` exactly. Its meta line reads "Jun 2026 · 15 min read" here
 * against "3 MINS · 7/27/26" on the redesigned Home Blog component
 * (`2134:1191`), which is the same card component in Figma; the component wins
 * over the loose copies of it, so the shipped format stays.
 */
export function InsightIndexView({
  items,
  resultsKey,
  categories,
  category,
  pagination,
  above,
  below,
}: InsightIndexViewProps) {
  const { page, totalPages } = pagination
  const activeTitle = categories.find((option) => option.slug === category)?.title

  return (
    <>
      {above}

      {/* `2337:4485` — bone, 128px 96px, 48px between the filter bar and the
          grid. Unlike the Home and About Blog rows the cards do not bleed past
          the right edge: the grid has nothing to scroll to at either width.

          The feed uses the 128px band spacing above and below its content. */}
      <div
        id="feed"
        className="px-gutter py-band-md bg-bone scroll-mt-20 lg:scroll-mt-[calc(var(--spacing-nav-pinned)+96px)]"
      >
        <div className="max-w-section mx-auto flex flex-col gap-12">
          {/*
           * The band the frame draws has no heading — the hero's job, and the
           * hero is an authored band now. But the cards are `h3`s under it, and
           * a page that skips a level fails an axe heading-order scan for real
           * reasons: a screen reader's heading list would offer no way into the
           * grid, and no way to tell a filtered grid from the whole collection.
           * So the level exists and is only unseen, and it says which cut is on
           * screen.
           */}
          <h2 tabIndex={-1} className="sr-only">
            {activeTitle ? `${activeTitle} insights` : 'All insights'}
          </h2>

          {categories.length > 0 ? (
            /*
             * A row 10px apart at both widths, composed two ways — the one
             * divergence ADR 0006 asks for here.
             *
             * At 402 (`2975:8656`) the six chips run to 657px in one
             * unwrapped row, past the frame's right edge: the bar scrolls
             * sideways. At 1440 (`2337:4486`) they fit, and the row wraps
             * because the number of chips is the collection's business, not
             * the frame's — the bar has to survive a category the frame never
             * drew.
             *
             * The scroll clips at the 1248 column rather than bleeding past
             * the gutter. The links provide keyboard access and scroll into view
             * as they receive focus. Exclude the scroll container itself from the
             * tab order so Firefox does not add a redundant stop before All.
             *
             * A chip lands on `#feed`, the same anchor the pager follows: the
             * band above it is the same authored hero either way, so what the
             * reader wants to see after a filter is the bar with the refreshed
             * feed under it. The band's `scroll-mt` keeps that head clear of
             * the pinned pill.
             */
            <nav
              aria-label="Filter by category"
              tabIndex={-1}
              className="flex items-center gap-2.5 overflow-x-auto [scrollbar-width:none] lg:flex-wrap lg:overflow-x-visible [&::-webkit-scrollbar]:hidden"
            >
              <FilterChip asChild selected={!category} className="shrink-0">
                <Link prefetch={false} href={insightsHref()}>
                  All
                </Link>
              </FilterChip>
              {categories.map((option) =>
                option.slug ? (
                  <FilterChip
                    key={option.slug}
                    asChild
                    selected={category === option.slug}
                    className="shrink-0"
                  >
                    <Link prefetch={false} href={insightsHref({ category: option.slug })}>
                      {option.title}
                    </Link>
                  </FilterChip>
                ) : null,
              )}
            </nav>
          ) : null}

          {items.length > 0 ? (
            /*
             * One column below `lg`, three at `lg` — the two frame widths and
             * nothing between them (ADR 0006: composition switches at `lg`,
             * size interpolates). A `md:grid-cols-2` would be a third
             * composition no frame draws.
             *
             * 3 × 395 + 2 × 32 = 1249, which is the frame's own row width and
             * `max-w-section` to the pixel. The 64px row gap is flat: both
             * frames set it, wrapped at 1440 (`2337:4492`) and stacked at 402
             * (`2975:8663`).
             */
            <RevealSequence key={resultsKey} boundaries="items">
              <ul data-insight-results className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
                {items.map((item, index) => (
                  <li key={item._id} data-reveal-step="card">
                    <InsightCard
                      {...item}
                      priority={index === 0}
                      mediaLayout="structural-three-up"
                    />
                  </li>
                ))}
              </ul>
            </RevealSequence>
          ) : (
            /* Reachable by hand-typing a category slug the feed has nothing
               for — the chips only offer categories that do. Unsourced: no
               frame draws an empty index. */
            <p data-insight-results className="text-lead text-fg-muted">
              No insights under that filter yet.
            </p>
          )}

          {/* A page link is followed from the feed's foot, and the next page's
              reading starts at its head rather than at the document top above
              the hero — the `#feed` the href builder carries. */}
          <Pager
            prefetch={false}
            page={page}
            totalPages={totalPages}
            href={(target) => insightsHref({ category, page: target })}
            className="mt-4"
          />
        </div>
      </div>

      {below}
    </>
  )
}
