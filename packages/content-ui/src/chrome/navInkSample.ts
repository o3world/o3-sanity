/**
 * The arithmetic behind the nav's ink flip, kept apart from the DOM so it can
 * be tested without a layout engine: what a colour weighs, and whether a strip
 * of the bar lands on a picture or beside it.
 */

/** A box in whatever space the caller is working in — viewport px, or image px. */
export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

/**
 * Perceived luminance above which a surface counts as light —
 * `0.299r + 0.587g + 0.114b > 140`, the prototype's threshold verbatim.
 *
 * It sits deliberately above mid-grey (127.5): `--color-bone` (#F1F0EC, ~240)
 * and white clear it easily, and every ink surface in the palette is nowhere
 * near it — `--color-ink` lands at 10.
 */
export const LIGHT_LUMINANCE = 140

export function luminance(r: number, g: number, b: number): number {
  return r * 0.299 + g * 0.587 + b * 0.114
}

/**
 * How a `background-position` component resolves, given the box it is
 * positioning inside and the size of what is being positioned.
 *
 * `getComputedStyle` hands back either a percentage or a px length on each
 * axis — keywords are normalised before they get here — and the percentage
 * form is the one that matters: it slides the image across the *slack*, so 50%
 * centres whatever the gap happens to be.
 */
export function positionOffset(value: string, box: number, drawn: number): number {
  const trimmed = value.trim()
  if (trimmed.endsWith('%')) {
    const fraction = Number.parseFloat(trimmed) / 100
    return Number.isFinite(fraction) ? (box - drawn) * fraction : 0
  }
  const length = Number.parseFloat(trimmed)
  return Number.isFinite(length) ? length : 0
}

/**
 * Does `sample` land on the picture drawn into `box`, or beside it?
 *
 * Only `contain` can answer no. It fits the whole picture inside the box and
 * leaves bars on one axis, and a strip of bar is not a strip of picture — the
 * ground there is whatever the element itself paints, and behind that whatever
 * the walk finds next. `cover` fills the box by definition, so it is answered
 * without arithmetic and this is never called for it.
 */
export function coversSample(
  sample: Box,
  box: Box,
  natural: { width: number; height: number },
  position: { x: string; y: string },
): boolean {
  const width = box.right - box.left
  const height = box.bottom - box.top
  if (width <= 0 || height <= 0 || natural.width <= 0 || natural.height <= 0) return false

  const scale = Math.min(width / natural.width, height / natural.height)
  const drawnWidth = natural.width * scale
  const drawnHeight = natural.height * scale
  const left = box.left + positionOffset(position.x, width, drawnWidth)
  const top = box.top + positionOffset(position.y, height, drawnHeight)

  return (
    sample.right > left &&
    sample.left < left + drawnWidth &&
    sample.bottom > top &&
    sample.top < top + drawnHeight
  )
}
