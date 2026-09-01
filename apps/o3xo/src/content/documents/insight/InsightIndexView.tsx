import Link from 'next/link'

import { CollectionHero, FilterChip } from '@o3/ui'
import { brandConfig } from '@o3/sanity/brand'
import type { INSIGHTS_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'
import type { Pagination } from '@o3/content-runtime/routes'
import { indexHref } from '@o3/content-runtime/routes/index-paths'

import { InsightCard } from '@o3/content-ui/cards'
import { Reveal } from '@o3/ui'
import { Pager } from '@o3/content-ui'

const { title: collectionTitle, prefix } = brandConfig().collections.insight

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
 * `/insights` and `/insights/category/design/page/2` — one builder over the
 * route's own scheme (#370), so a chip, a pager link and the route cannot
 * disagree about how this index spells its state. A chip resets the page (a
 * new filter has no page 4 in common with the old one); the pager keeps the
 * filter. The prefix is brand config's.
 */
function insightsHref({
  category,
  page = 1,
}: { category?: string | null; page?: number } = {}): string {
  return indexHref(prefix, { facets: { category: category ?? null }, page })
}

/**
 * The insights index, composed as the frame #61 commissioned composes it
 * (`2336:4310`).
 *
 * ```
 * hero      2336:4477   Interior Hero, ink, 192/64, eyebrow + h2
 * band      2337:4485   light band, 128px 96px, gap 48
 *   filters 2337:4486   chip row, gap 10, All + one per category
 *   grid    2337:4492   1249 wide, wrap, gap 64 × 32 — three 395px cards
 * ```
 *
 * Borrowing O3's composition is the adaptation experiment (ADR 0028 addendum).
 * The copy is not borrowed — O3's standfirst describes O3's world. It is
 * **o3xo.ai's own**, read off the index the site serves at `/insights` (#218):
 * the heading and standfirst below are that page's two hero lines. The eyebrow
 * is the collection's name, which is the role the frame gives it.
 *
 * The copy lives here rather than in a document because a collection index has
 * none (CONTEXT.md) — the same place apps/web keeps its own.
 *
 * Two divergences from the frame, both inherited from apps/web and both still
 * true here: the chip bar draws every category that has an article rather than
 * the frame's curated five, and the pager exists because a real feed does not
 * fit one canvas. The pager is the one part of this route the O3XO kit does
 * draw (`4404:1821`), and `Pager` is built to it for both brands.
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
        eyebrow={collectionTitle}
        heading="Learn what drives AI advantage"
        subheading="Looking for firsthand knowledge on AI implementation? We’re passionate about helping organizations activate AI and want to share what we’ve learned. Explore our perspectives on practical AI strategy, industry-specific use cases, adoption challenges, and how to achieve measurable ROI from AI investments."
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
              {items.map((item, index) => (
                <li key={item._id}>
                  {/* The stagger is the card's COLUMN in the widest grid, not
                      its place in the feed: twelve cards staggered end to end
                      would keep the last one waiting most of a second after the
                      reader reached it. Narrower widths keep the modulo and lose
                      nothing — a stagger is only ever seen where cards enter
                      together, and below `lg` they enter one at a time. */}
                  <Reveal delay={(index % 3) * 80}>
                    <InsightCard {...item} />
                  </Reveal>
                </li>
              ))}
            </ul>
          ) : (
            /* Reachable by hand-typing a category slug the feed has nothing
               for — the chips only offer categories that do. Unsourced: no
               frame draws an empty index. */
            <p className="text-lead text-fg-muted">No insights under that filter yet.</p>
          )}

          <Pager
            page={page}
            totalPages={totalPages}
            href={(target) => insightsHref({ category, page: target })}
            className="mt-4"
          />
        </div>
      </div>

      {/*
       * The frame closes this page on the shared CTA band (`2336:4351`), and
       * apps/web renders it here. It is left out until O3XO has something for
       * it to say: the band's copy and its destination are authored facts —
       * O3's line, pointing at O3's `/contact` — and this app has neither yet.
       * A band carrying the other brand's sentence over a link that 404s is
       * worse than a page that ends at the grid. It comes back with the copy
       * and the route, not before.
       */}
    </>
  )
}
