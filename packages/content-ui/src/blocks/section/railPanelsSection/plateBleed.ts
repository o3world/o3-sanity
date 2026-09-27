/**
 * THE PLATE THAT RUNS OFF THE RIGHT EDGE — the `plate: bleed` knob.
 *
 * The box keeps the plate's left edge and its 396 height at `lg`, and grows
 * rightward until it meets the viewport. The plate is a flex item, and a flex
 * item's margin is part of its outer size, so a negative right margin is what
 * lets the box past the panel column: `flex-1` hands it the row's leftover
 * (the 395 the square would have had) and the margin adds the distance from
 * the column's edge to the screen's. That distance is the gutter below the
 * stage cap and the named half-stage above it; `min()` of the two negatives
 * takes whichever is the larger distance, the same expression
 * `LayoutSection`'s bleeding column uses.
 *
 * Below `lg` the plate sits under the copy, so it only has the one gutter to
 * cross: it stays square and runs from the copy's left edge to the viewport's
 * right, `-mr-6` matching the mobile rail band’s 24px gutter.
 *
 * The picture fills the box (`ratio="fill"`), so a bleeding plate crops
 * rather than sizes to its media; the knob's description says as much.
 */
export const PLATE_BLEED_CLASS =
  '-mr-6 aspect-square ' +
  'lg:mr-[min(calc(-1*var(--spacing-gutter)),calc(var(--container-section-half)-50vw))] lg:aspect-auto lg:h-[396px] lg:min-w-0 lg:flex-1'

/**
 * `sizes` for the bleeding plate. From `lg`, the panel row first shares a
 * shrinking structural stage with the 82px rail and 64px minimum gap; once
 * that row reaches its 928px cap, the plate is its 395px base plus the live
 * gutter. At 1440 that settles to 491px. After the 1728px stage caps, the
 * centred distance beyond it grows the plate again. Under `lg` it is the
 * viewport less one gutter.
 */
export const PLATE_BLEED_SIZES =
  '(min-width: 1920px) calc(50vw - 469px), (min-width: 1440px) 491px, (min-width: 1234.3px) calc(7.70713vw + 380.01734px), (min-width: 1024px) calc(92.29287vw - 664.01734px), calc(100vw - 24px)'
