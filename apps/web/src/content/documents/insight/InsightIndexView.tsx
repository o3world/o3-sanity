import Link from 'next/link'

import { ArrowIcon, Button, CollectionHero, FilterChip } from '@o3/ui'
import type { INSIGHTS_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { InsightCard } from './InsightCard'
import { CtaSection } from '@/content/blocks/section/ctaSection/CtaSection'
import type { Pagination } from '@/lib/content-routes/types'

type IndexData = NonNullable<INSIGHTS_PAGE_QUERY_RESULT>

interface InsightIndexViewProps {
  readonly items: IndexData['items']
  /** Every category with an article to show — the filter bar's options. */
  readonly categories: IndexData['categories']
  /** The category slug the URL asked for, or null on the unfiltered index. */
  readonly category: string | null
  readonly pagination: Pagination
}

/**
 * `/insights` and `/insights?category=design&page=2` — one builder, so a chip
 * and a pager link can never disagree about how this route spells its state.
 * A chip resets the page (a new filter has no page 4 in common with the old
 * one); the pager keeps the filter.
 */
function insightsHref({
  category,
  page,
}: { category?: string | null; page?: number } = {}): string {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (page && page > 1) params.set('page', String(page))
  const query = params.toString()
  return query ? `/insights?${query}` : '/insights'
}

/**
 * The /insights index, built to the frame #61 commissioned (`2336:4310`).
 *
 * ```
 * hero      2336:4477   Interior Hero, ink, 192/64, eyebrow + h2 + standfirst
 * band      2337:4485   bone #F1F0EC, 128px 96px, gap 48
 *   filters 2337:4486   chip row, gap 10, All + one per category
 *   grid    2337:4492   1249 wide, wrap, gap 64 × 32 — three 395px cards
 *   card    2337:4493   the same InsightCard the Home row draws
 * cta       2336:4351   the shared CTA band, its own default copy
 * ```
 *
 * The route was **provisional** until this frame: it borrowed the Work hero
 * and the Home Blog band, and three elements traced to nothing. Two of those
 * are now drawn — the hero standfirst is the frame's own copy, and the desktop
 * row gap is its 64. The third is still open, below.
 *
 * ## The filter is the point of the frame
 *
 * #49 declined to invent a category filter and #61 asked the frame to settle
 * it. It did: `2337:4486` draws All plus five categories, and the labels are
 * five real migrated categories (AI, Design, Technology, 1682 Conference, Life
 * at O3) rather than sample words — so the control filters on `category`, and
 * the chips come from the collection instead of from a hand-kept list here.
 *
 * It is **server-side and in the URL** (`?category=design`), which is what
 * makes a filtered index linkable, crawlable and free of client state. The
 * mechanism is `IndexEntry.facets` — see `content-routes/build.tsx`.
 *
 * Two divergences from the frame worth stating rather than burying:
 *
 * 1. **The frame draws five chips; this draws every category that has an
 *    article.** A curated subset would need a field marking a category as
 *    featured, and no schema says that. The bar wraps instead.
 * 2. **The frame has no pager**, because nine cards fit its canvas. 273
 *    articles do not, so the pager stays — the same one, at the same 12 a
 *    page. It remains the one element on this route no frame draws.
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
  categories,
  category,
  pagination,
}: InsightIndexViewProps) {
  const { page, totalPages } = pagination
  const activeTitle = categories.find((option) => option.slug === category)?.title

  return (
    <>
      <CollectionHero
        variant="interior"
        eyebrow="Insights"
        heading="News of the world"
        subheading="Looking for some firsthand knowledge from our world? Check out our in-depth thoughts about the industry today, our culture at O3, the future of AI and digital experiences, and other relevant topics."
      />

      {/* `2337:4485` — bone, 128px 96px, 48px between the filter bar and the
          grid. Unlike the Home and About Blog rows this one does not bleed
          past the right edge: there is nothing to scroll to, so the overhang
          would promise a gesture the page cannot honour. */}
      <div className="px-gutter py-band-md bg-bone">
        <div className="max-w-section mx-auto flex flex-col gap-12">
          {/*
           * The band the frame draws has no heading — the Home Blog row's
           * "The thinking behind the work." is the hero's job here. But the
           * cards are `h3`s under the hero's `h1`, and a page that skips a
           * level fails an axe heading-order scan for real reasons: a screen
           * reader's heading list would offer no way into the grid, and no way
           * to tell a filtered grid from the whole collection. So the level
           * exists and is only unseen, and it says which cut is on screen.
           */}
          <h2 className="sr-only">{activeTitle ? `${activeTitle} insights` : 'All insights'}</h2>

          {categories.length > 0 ? (
            /* `2337:4486`: a row 10px apart. It wraps because the number of
               chips is the collection's business, not the frame's. */
            <nav aria-label="Filter by category" className="flex flex-wrap items-center gap-2.5">
              <FilterChip asChild selected={!category}>
                <Link href={insightsHref()}>All</Link>
              </FilterChip>
              {categories.map((option) =>
                option.slug ? (
                  <FilterChip key={option.slug} asChild selected={category === option.slug}>
                    <Link href={insightsHref({ category: option.slug })}>{option.title}</Link>
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
             * `max-w-section` to the pixel. The 64px row gap is read at 1440
             * (`2337:4492`); below `lg` the cards stack 48 apart, the value
             * the 402 Blog band uses (`1814:1738`).
             */
            <ul className="grid grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-3 lg:gap-y-16">
              {items.map((item) => (
                <li key={item._id}>
                  <InsightCard {...item} />
                </li>
              ))}
            </ul>
          ) : (
            /* Reachable by hand-typing a category slug the feed has nothing
               for — the chips only offer categories that do. Unsourced: no
               frame draws an empty index. */
            <p className="text-lead text-fg-muted">No insights under that filter yet.</p>
          )}

          {totalPages > 1 ? (
            <nav aria-label="Pagination" className="mt-4 grid grid-cols-3 items-center gap-4">
              <div className="justify-self-start">
                {page > 1 ? (
                  <Button asChild variant="light">
                    <Link href={insightsHref({ category, page: page - 1 })} rel="prev">
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
                    <Link href={insightsHref({ category, page: page + 1 })} rel="next">
                      Next
                      <ArrowIcon />
                    </Link>
                  </Button>
                ) : null}
              </div>
            </nav>
          ) : null}
        </div>
      </div>

      {/*
       * `2336:4351` — the shared CTA band closes this page as it closes the
       * other six frames that instance it. The copy is the component's own
       * default, which is also the line five seed pages already carry, so
       * nothing here is authored for this route; a collection index has no
       * document to hold it, the same reason the hero copy is in this file.
       */}
      <CtaSection
        heading="Let’s get started on your next big thing."
        body="We partner with businesses like yours to build experiences that matter. If you’re ready, we’re ready."
        // No contrast: the band declares ink and Auto reads it, so this
        // route-owned button carries the same fill an authored one would.
        button={{
          _type: 'button',
          label: 'Get in touch',
          href: '/contact',
          target: null,
        }}
        decoration="molecule"
      />
    </>
  )
}
