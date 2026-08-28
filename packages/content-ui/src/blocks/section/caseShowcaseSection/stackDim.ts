/**
 * The dim a stacked case card carries — the one value the CSS stack cannot
 * express on its own.
 *
 * The cards pin at the same offset and paint over one another in document
 * order, so a covered card is still there, at full strength, behind the one on
 * top of it. Fading it as it is covered is what turns an overlap into a stack.
 */

/** How far a fully covered card fades. */
export const STACK_DIM_FLOOR = 0.3

export interface StackedCardMetrics {
  /** Where the card pins, measured from the viewport top, in px. */
  stickyTop: number
  /** The pinned card's own height, in px. */
  height: number
  /** The next card's top edge, in viewport coordinates, in px. */
  nextTop: number
}

/**
 * The opacity a pinned card should carry, given how much of it the next card
 * has covered. Coverage runs from 0 — the next card's top edge still level
 * with the pinned card's floor — to 1, where it has travelled the card's whole
 * height and hidden it completely.
 *
 * A card with no height cannot be partly covered, so it stays opaque rather
 * than dividing by zero.
 */
export function stackedCardOpacity(
  { stickyTop, height, nextTop }: StackedCardMetrics,
  floor: number = STACK_DIM_FLOOR,
): number {
  if (height <= 0) return 1
  const covered = (stickyTop + height - nextTop) / height
  const progress = Math.min(1, Math.max(0, covered))
  return 1 - progress * (1 - floor)
}
