/**
 * THE PLATE THAT RUNS OFF THE RIGHT EDGE — the `plate: bleed` knob.
 *
 * The box keeps the plate's left edge and its 396 height at `lg`, and grows
 * rightward until it meets the viewport. The plate is a flex item, and a flex
 * item's margin is part of its outer size, so a negative right margin is what
 * lets the box past the panel column: `flex-1` hands it the row's leftover
 * (the 395 the square would have had) and the margin adds the distance from
 * the column's edge to the screen's. That distance is the gutter below the
 * 1440 cap and `50vw − 624` above it; `min()` of the two negatives takes
 * whichever is the larger distance, the same expression `LayoutSection`'s
 * bleeding column uses.
 *
 * Below `lg` the plate sits under the copy, so it only has the one gutter to
 * cross: it stays square and runs from the copy's left edge to the viewport's
 * right, `-mr-gutter` being that exact distance at every width under 1440.
 *
 * The picture fills the box (`ratio="fill"`), so a bleeding plate crops
 * rather than sizes to its media; the knob's description says as much.
 */
export const PLATE_BLEED_CLASS =
  '-mr-gutter aspect-square ' +
  'lg:mr-[min(calc(-1*var(--spacing-gutter)),calc(624px-50vw))] lg:aspect-auto lg:h-[396px] lg:min-w-0 lg:flex-1'

/**
 * `sizes` for the bleeding plate. At 1440 the box is 491; at 1920 it is 731,
 * and the `50vw` term is what it grows by from there. Under `lg` it is the
 * viewport less one gutter.
 */
export const PLATE_BLEED_SIZES =
  '(min-width: 1440px) calc(50vw - 229px), (min-width: 1024px) 45vw, 95vw'
