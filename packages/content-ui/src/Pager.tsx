import Link from 'next/link'

import { cn } from '@o3/ui'

/**
 * A collection index's numbered pager, from the O3XO UI kit's `Pagination`
 * canvas — the `Numbers` component, `4404:1821` in `G6M2gu5qKFvhGxwj3W365b`.
 *
 * ```
 * 1  2  …  6  Next        row, 5px apart, each pill 40 × 37, radius 12
 *   page 1     #000000 fill, white label
 *   the rest   #FFFFFF fill, #CCCCCC hairline, #333333 label
 *   ellipsis   no plate, the same label colour
 * ```
 *
 * ## The kit draws anatomy, the token packages supply the values
 *
 * The set has **no variant axes** — it is one component, and the canvas is an
 * HTML import of the live o3xo.ai Framer site (its frames are named
 * `button.pagination-button` and `span.pagination-ellipsis`, its paddings are
 * fractional). So it is a strong source for the arrangement and a weak one for
 * geometry, and three of its values are read as the design system's rather
 * than transcribed:
 *
 * - **Radius is `--radius-btn`**, the 5px every button in this repo carries,
 *   not the import's 12. A pill is a button and the repo's rule is that a
 *   value with a token is never picked by eye (`@o3/tailwind-config`).
 * - **Type is `--text-button`**, the step every other control uses, against the
 *   import's 16/19.2.
 * - **Hover and focus are invented from the tokens.** The kit draws no
 *   interaction states anywhere, and the hover here is `FilterChip`'s — the
 *   nearest control this repo already ships.
 *
 * Every colour is a role both brands' token packages define, so O3 paints this
 * in its warm black over `#D6D3CC` hairlines and O3XO in its slate over
 * `#E5E7EB` (ADR 0028, `brand-token-seam.test.ts`).
 *
 * O3's own Figma draws no pager at all — `docs/figma-components.md` has no
 * pagination row, and the Insights frame `2336:4310` fits nine cards on one
 * canvas. The kit is the only drawing of this control either brand has.
 *
 * ## Why it lives here and not in `@o3/ui`
 *
 * A pager is a list of links whose length is the collection's business, so the
 * `asChild` slot that lets `FilterChip` stay framework-free does not reach: the
 * caller cannot hand one child to a row of six. This package already imports
 * `next/link` for every other shared component that navigates — the cards, the
 * chrome, `ButtonLink` — and a plain `<a>` would drop the soft navigation the
 * indexes have today.
 *
 * ```tsx
 * <Pager page={page} totalPages={totalPages} href={(p) => insightsHref({ category, page: p })} />
 * ```
 */
const PILL =
  'inline-flex min-w-10 items-center justify-center rounded-btn border px-3 py-2 text-button transition-colors duration-(--duration-hover) ease-out focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:outline-none'

/**
 * The two plates the kit draws. There is **no `cva` here** and that is the
 * rule rather than an exception to it: one Figma variant axis → one `cva`
 * variants key, and this set declares no axes. `current` is a fact about the
 * URL — the page you are on — not a look an author picks, so it is a boolean
 * the row derives, the same call `FilterChip.selected` makes.
 */
function pillClass(current: boolean): string {
  return cn(
    PILL,
    current
      ? 'bg-ink text-white border-ink'
      : 'bg-white text-fg-body border-line hover:bg-ink hover:text-white hover:border-ink',
  )
}

/** A page to link, or the run of pages the row elides. */
type Slot = number | 'gap'

/**
 * The pages the row draws: the first, the last, and the current page with a
 * neighbour either side. A run of more than one omitted page becomes an
 * ellipsis; a run of exactly one is spelled out instead, because `…` is wider
 * than the number it would stand for.
 *
 * The kit draws only page 1 of 6 (`1 2 … 6`), which this reproduces. What it
 * does from any other page is this rule rather than a frame.
 */
function pageSlots(page: number, totalPages: number): Slot[] {
  const kept = [
    ...new Set([1, page - 1, page, page + 1, totalPages].filter((n) => n >= 1 && n <= totalPages)),
  ].sort((a, b) => a - b)

  return kept.flatMap((n, i) => {
    const previous = kept[i - 1]
    if (previous === undefined) return [n]
    if (n - previous === 2) return [n - 1, n]
    return n - previous > 2 ? (['gap', n] as Slot[]) : [n]
  })
}

export interface PagerProps {
  /** The page on screen, 1-based. */
  readonly page: number
  readonly totalPages: number
  /**
   * The URL of a page. The caller owns query policy — the collection's prefix,
   * and any facet the page has to keep — so a chip and a pager link cannot
   * disagree about how a route spells its state.
   */
  readonly href: (page: number) => string
  readonly className?: string
}

export function Pager({ page, totalPages, href, className }: PagerProps) {
  // A collection that fits on one page has nothing to navigate.
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Pagination" className={cn('flex justify-center', className)}>
      {/* 5px between pills plus the 2px margin frame either side (`4404:1782`). */}
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 ? (
          <li>
            <Link href={href(page - 1)} rel="prev" className={pillClass(false)}>
              Previous
            </Link>
          </li>
        ) : null}

        {pageSlots(page, totalPages).map((slot, i) =>
          slot === 'gap' ? (
            /* `4404:1788` — a plate-less marker, not a control. It stands for
               pages a reader can still reach from the ends of the row. */
            <li key={`gap-${i}`} aria-hidden="true" className="text-fg-body text-button px-3 py-2">
              …
            </li>
          ) : (
            <li key={slot}>
              <Link
                href={href(slot)}
                // A bare "4" is no accessible name. The visible label is inside
                // this one, which is what keeps label-in-name satisfied.
                aria-label={`Page ${slot}`}
                aria-current={slot === page ? 'page' : undefined}
                className={pillClass(slot === page)}
              >
                {slot}
              </Link>
            </li>
          ),
        )}

        {page < totalPages ? (
          <li>
            <Link href={href(page + 1)} rel="next" className={pillClass(false)}>
              Next
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
