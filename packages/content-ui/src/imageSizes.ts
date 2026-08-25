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
 * **The gutter** is `clamp(20px, 7.32vw - 9.4px, 96px)` (tokens/layout.css) —
 * 20px at 402, 96px from 1440 up.
 *
 * **The content column** is `max-w-section` (1248px) inside that gutter, so
 * its real width is `min(1248, 100vw - 2 × gutter)`: `0.8536 × 100vw + 18.8px`
 * from 402 to 1440, and 1248px above. As a fraction of the viewport that runs
 * from 90% at 402 to 86.7% at 1440, which is why **`90vw` stands in for the
 * content column below 1440** everywhere here: it is the tightest single value
 * that never declares less than the column actually is.
 *
 * `100vw` is therefore only correct for a band that genuinely bleeds to both
 * edges. Every other slot is narrower, and the gutter is the reason.
 */

/**
 * Edge to edge — a full-bleed band with no gutter (`mediaSection` at
 * `full-bleed`, the two detail heroes).
 */
export const FULL_BLEED = '100vw'

/**
 * The content column: `max-w-section` inside the page gutter. `CaseStudyCard`
 * and `NextCaseBand` fill it; a `figure` in a `layoutSection` column can be as
 * wide as it at one column.
 */
export const CONTENT_COLUMN = '(min-width: 1440px) 1248px, 90vw'

/**
 * The prose measure: `max-w-article` (822px) inside the page gutter. The
 * column reaches 822 at a 941px viewport, so from `lg` up it is 822 flat.
 */
export const ARTICLE_COLUMN = '(min-width: 1024px) 822px, 90vw'

/**
 * The column that runs off the right edge in a bleeding `layoutSection`
 * (`2360:2861`): the band's gutter and the 395 copy column beside it are what
 * it does not get, and the viewport's right edge is where it stops. 1440 −
 * 96 − 395 − 31 = 918, which is 64% of that width.
 */
export const LAYOUT_BLEED_COLUMN = '(min-width: 1024px) 64vw, 90vw'

/**
 * A base block's slot in a `layoutSection` column, by the section's column
 * count. The grid is `gap-10` (40px) inside the content column and switches at
 * `md`, not `lg` — below that every count is one column.
 *
 * Only the section knows the count, so it passes the value down; a base block
 * that guessed the widest case would ask for 1248px on a 604px slot, which is
 * the 1920 candidate where 640 would do.
 */
export const LAYOUT_COLUMN: Record<1 | 2 | 3, string> = {
  1: CONTENT_COLUMN,
  // (1248 − 40) / 2 = 604 at the cap; 41.3–41.9% of the viewport between.
  2: '(min-width: 1440px) 604px, (min-width: 768px) 42vw, 90vw',
  // (1248 − 80) / 3 = 389 at the cap; 25.8–27.0% between.
  3: '(min-width: 1440px) 389px, (min-width: 768px) 28vw, 90vw',
}

/**
 * A card in a three-up row — the insight card and the in-flight card, in both
 * of their containers. The carousel and in-flight tracks pin the card at
 * `lg:w-[394px]` from `lg` up while the `/insights` grid lets it flex from 276
 * to 395, so 395px is the width one value has to cover for both. Below `lg`
 * every one of those containers is one card wide: the content column.
 */
export const CARD_THREE_UP = '(min-width: 1024px) 395px, 90vw'
