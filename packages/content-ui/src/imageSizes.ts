/**
 * The layout slots an image is rendered into, as `sizes` strings.
 *
 * `sizes` tells the browser how wide the image will be laid out BEFORE the
 * layout exists, so it can pick a srcset candidate. Get it wrong low and the
 * picture upscales; get it wrong high — `100vw` on a card grid — and a phone
 * downloads a desktop-width file it throws away. Only slots that recur live
 * here; a one-off slot states its own derivation at the call site.
 *
 * ## The two facts every value is derived from
 *
 * **The gutter** is `clamp(16px, 7.70713vw - 14.98266px, 96px)`
 * (tokens/layout.css): 16px at 402, 96px from 1440 up.
 *
 * **The structural column** is `max-w-section` (1728px) inside that gutter.
 * It grows to its cap at 1920px. The fluid interval is the viewport minus
 * two gutters; below 402px the gutter stays at its 16px floor.
 *
 * `100vw` is therefore only correct for a band that genuinely bleeds to both
 * edges. Every other slot is narrower, and the gutter is the reason.
 */

/**
 * Edge to edge — a full-bleed band with no gutter (`mediaSection` at
 * `full-bleed`, the two detail heroes).
 */
export const FULL_BLEED = '100vw'

/** The viewport minus two gutters: the structural column before it caps. */
export const FLUID_COLUMN = '(min-width: 402px) calc(84.58574vw + 29.96532px), calc(100vw - 32px)'

/**
 * The content column: `max-w-section` inside the page gutter. `CaseStudyCard`
 * and `NextCaseBand` fill it; a `figure` in a `layoutSection` column can be as
 * wide as it at one column.
 */
export const CONTENT_COLUMN = `(min-width: 1920px) 1728px, (min-width: 1440px) calc(100vw - 192px), ${FLUID_COLUMN}`

/**
 * The prose measure: `max-w-article` (822px) inside the page gutter. The new
 * gutter curve gives the structural column 822px at a 936.37px viewport, so it is
 * flat from there rather than declaring a larger candidate until `lg`.
 */
export const ARTICLE_COLUMN = `(min-width: 936.37px) 822px, ${FLUID_COLUMN}`

/**
 * The column that runs off the right edge in a bleeding `layoutSection`
 * (`2360:2861`): the band's gutter and the 395 copy column plus 32px gap beside
 * it are what it does not get, and the viewport's right edge is where it stops.
 * At 1440 that is 1440 − 96 − 395 − 32 = 917px. Once the stage caps, its left
 * edge recentres while the media still reaches the viewport edge.
 */
export const LAYOUT_BLEED_COLUMN = `(min-width: 1920px) calc(50vw + 437px), (min-width: 1440px) calc(100vw - 523px), (min-width: 1024px) calc(92.29287vw - 412.01734px), ${FLUID_COLUMN}`

/**
 * A base block's slot in a `layoutSection` column, by the section's column
 * count. The grid is `gap-10` (40px) inside the content column and switches at
 * `md`, not `lg` — below that every count is one column.
 *
 * Only the section knows the count, so it passes the value down; a base block
 * that guessed the widest case would ask for 1728px on an 844px slot.
 */
export const LAYOUT_COLUMN: Record<1 | 2 | 3, string> = {
  1: CONTENT_COLUMN,
  // (1728 − 40) / 2 = 844 at the cap; the exact pinned-gutter slot above 1440.
  2: `(min-width: 1920px) 844px, (min-width: 1440px) calc(50vw - 116px), (min-width: 768px) calc(42.29287vw - 5.01734px), ${FLUID_COLUMN}`,
  // (1728 − 80) / 3 = 549.3 at the cap; the exact pinned-gutter slot above 1440.
  3: `(min-width: 1920px) 550px, (min-width: 1440px) calc(33.333333vw - 90.666667px), (min-width: 768px) calc(28.195247vw - 16.67844px), ${FLUID_COLUMN}`,
}

/**
 * A three-up structural grid that does not split until `lg`, such as the
 * Insights index. Its 32px gaps differ from `LayoutSection`'s 40px gaps; the
 * exact three-up slot is `(stage − 64px) / 3`. Between `sm` and `lg` the card
 * retains its established 395px cap even though the grid is one column.
 */
export const STRUCTURAL_THREE_UP = `(min-width: 1920px) 555px, (min-width: 1440px) calc(33.333333vw - 85.333333px), (min-width: 1024px) calc(28.195247vw - 11.344893px), (min-width: 640px) 395px, ${FLUID_COLUMN}`

/**
 * The About people grid is two-up from `sm`, then three-up from `lg`. Its
 * middle interval is `(stage − 32px) / 2`; its three-up interval is
 * `(stage − 64px) / 3`, matching the grid's real 32px gaps.
 */
export const PERSON_GRID_COLUMN = `(min-width: 1920px) 555px, (min-width: 1440px) calc(33.333333vw - 85.333333px), (min-width: 1024px) calc(28.195247vw - 11.344893px), (min-width: 640px) calc(42.29287vw - 1.01734px), ${FLUID_COLUMN}`

/**
 * A card in a three-up row — the insight card and the in-flight card, in both
 * of their containers. The carousel pins the card at 394px from `sm` up and
 * both cards cap their square tile at 395px there too, while the `/insights`
 * grid lets the card flex from 276 to 395 at `lg`, so 395px is the width one
 * value has to cover from `sm`. Below that every container is one card wide:
 * the content column.
 */
export const CARD_THREE_UP = `(min-width: 640px) 395px, ${FLUID_COLUMN}`
