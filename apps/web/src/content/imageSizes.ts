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
 * A card in a three-up row — the insight card and the in-flight card, in both
 * of their containers. The carousel and in-flight tracks pin the card at
 * `lg:w-[394px]` from `lg` up while the `/insights` grid lets it flex from 276
 * to 395, so 395px is the width one value has to cover for both. Below `lg`
 * every one of those containers is one card wide: the content column.
 */
export const CARD_THREE_UP = '(min-width: 1024px) 395px, 90vw'
