import Link from 'next/link'

import { CollectionHero, FilterChip } from '@o3/ui'
import type { INSIGHTS_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'
import type { Pagination } from '@o3/content-runtime/routes'

import { InsightCard } from '@o3/content-ui/cards'
import { CtaSection, Pager } from '@o3/content-ui'

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
 * The /insights index, built to the frame #61 commissioned (`2336:4310`) and
 * its 402 companion (`2975:8499`).
 *
 * ```
 * hero      2336:4477   Interior Hero, ink, 192/64, eyebrow + h2 + standfirst
 * band      2337:4485   bone #F1F0EC, 128px 96px, gap 48
 *   filters 2337:4486   chip row, gap 10, All + one per category
 *   grid    2337:4492   1249 wide, wrap, gap 64 × 32 — three 395px cards
 *   card    2337:4493   the same InsightCard the Home row draws
 * cta       2336:4351   the shared CTA band, its own copy, "View our work"
 * ```
 *
 * At 402 the same bands stack: the chip row scrolls sideways (`2975:8656`)
 * and the grid is one 370px column 64 apart (`2975:8663`).
 *
 * The hero's headline is the frame's. Its standfirst is **not**: what the
 * frame shows there ("Not the deliverable…") is the Interior Hero set's
 * placeholder default, so the route's own line stays.
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
 * mechanism is `IndexEntry.facets` — see `@o3/content-runtime/routes`.
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
        heading="Learn about what drives our experiences."
        subheading="Looking for some firsthand knowledge from our world? Check out our in-depth thoughts about the industry today, our culture at O3, the future of AI and digital experiences, and other relevant topics."
      />

      {/* `2337:4485` — bone, 128px 96px, 48px between the filter bar and the
          grid. Unlike the Home and About Blog rows the cards do not bleed past
          the right edge: the grid has nothing to scroll to at either width.

          128 is flat, and the 402 band is deliberately not followed. `2975:8655`
          pads 24 top and bottom inside a 16px gutter, where every other band on
          that frame pads 96 or 128 inside the 20px gutter the token defines —
          it is off-system on both axes at once, which is the signature of a
          nudged layer rather than a rhythm. band-md is 128 at both widths by
          design (layout.css), so the band keeps it. */}
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
             * the gutter, which is where `CarouselTrack` and the "Keep
             * reading" row already put the same edge. No `tabIndex` either:
             * unlike those tracks this one is made of links, so tabbing
             * through the chips scrolls them into view by itself.
             */
            <nav
              aria-label="Filter by category"
              className="flex items-center gap-2.5 overflow-x-auto [scrollbar-width:none] lg:flex-wrap lg:overflow-x-visible [&::-webkit-scrollbar]:hidden"
            >
              <FilterChip asChild selected={!category} className="shrink-0">
                <Link href={insightsHref()}>All</Link>
              </FilterChip>
              {categories.map((option) =>
                option.slug ? (
                  <FilterChip
                    key={option.slug}
                    asChild
                    selected={category === option.slug}
                    className="shrink-0"
                  >
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
             * `max-w-section` to the pixel. The 64px row gap is flat: both
             * frames set it, wrapped at 1440 (`2337:4492`) and stacked at 402
             * (`2975:8663`).
             */
            <ul className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
              {items.map((item, index) => (
                <li key={item._id}>
                  {/* The first card sits in the first screen under the hero,
                      the largest picture on the route. It is the only image
                      here that is preloaded. */}
                  <InsightCard {...item} priority={index === 0} />
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
       * The shared CTA band closes this page. The words are the component's
       * own default, which is also the line five seed pages carry, so nothing
       * here is authored for this route; a collection index has no document to
       * hold it, the same reason the hero copy is in this file.
       *
       * The frame's closer is `2975:8788` (`2975:8801` at 402), and its
       * button is the one authored thing on it: "View our work" → /work, the
       * next move a reader who has just finished the feed can make. Both
       * frames draw it, so the route no longer sends them to /contact.
       *
       * **`orbs`, and the frame is why.** Both closers are a full-bleed raster
       * (`imageRef 51458151e760cc2e868b5f9aa7f2e939609a9a6c`) over a native
       * 172/64px `--gradient-ink-fade` strip (`2975:8795`, `2975:8807`). That
       * strip belongs to the sphere's composition, and the same imageRef sits
       * on Home's own orbs band and on the About, Live and insight-detail
       * closers — so this is Home's band pasted, not a photograph, and it is
       * drawn rather than exported for the reason `CtaSection` gives.
       */}
      <CtaSection
        heading="Let’s get started on your next big thing."
        body="We partner with businesses like yours to build experiences that matter. If you’re ready, we’re ready."
        // No contrast: the band declares ink and Auto reads it, so this
        // route-owned button carries the same fill an authored one would.
        button={{
          _type: 'button',
          label: 'View our work',
          href: '/work',
          target: null,
        }}
        decoration="orbs"
      />
    </>
  )
}
