/**
 * The arithmetic behind the nav's ink flip, kept apart from the DOM so it can
 * be tested without a layout engine or a canvas: what a colour weighs, and
 * which pixels of a background image a strip of the viewport lands on.
 */

/** A box in whatever space the caller is working in — viewport px, or image px. */
export interface Box {
  left: number
  top: number
  right: number
  bottom: number
}

/** A decoded image, in the shape `ImageData` already has. */
export interface Pixels {
  width: number
  height: number
  data: Uint8ClampedArray | number[]
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
 * The most pixels either axis of a region is averaged over. An LQIP is 20px on
 * its long side, so this never actually bites there; it is the guard that keeps
 * the cost flat if a bigger image is ever sampled the same way.
 */
const MAX_SAMPLES = 8

/**
 * How a `background-position` component resolves, given the box it is
 * positioning inside and the size of what is being positioned.
 *
 * `getComputedStyle` hands back either a percentage or a px length on each
 * axis — keywords are normalised before they get here — and the percentage
 * form is the one that matters: it slides the image across the *slack*, so 50%
 * centres whatever the overflow or the gap happens to be.
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
 * Which pixels of `natural`, painted into `box` under `cover` or `contain`,
 * lie beneath `sample`.
 *
 * Returns `null` when the sample falls entirely outside the painted image —
 * the letterbox around a `contain`, or a strip of a box the image does not
 * reach.
 */
export function sampledRegion(
  sample: Box,
  box: Box,
  natural: { width: number; height: number },
  cover: boolean,
  position: { x: string; y: string },
): Box | null {
  const width = box.right - box.left
  const height = box.bottom - box.top
  if (width <= 0 || height <= 0 || natural.width <= 0 || natural.height <= 0) return null

  const ratios = [width / natural.width, height / natural.height]
  const scale = cover ? Math.max(...ratios) : Math.min(...ratios)
  const drawnWidth = natural.width * scale
  const drawnHeight = natural.height * scale
  const offsetX = box.left + positionOffset(position.x, width, drawnWidth)
  const offsetY = box.top + positionOffset(position.y, height, drawnHeight)

  const left = Math.max(0, (sample.left - offsetX) / scale)
  const right = Math.min(natural.width, (sample.right - offsetX) / scale)
  const top = Math.max(0, (sample.top - offsetY) / scale)
  const bottom = Math.min(natural.height, (sample.bottom - offsetY) / scale)
  if (right <= left || bottom <= top) return null
  return { left, top, right, bottom }
}

/**
 * Mean luminance over a region of an image, on a grid capped at
 * `MAX_SAMPLES` per axis. `null` where the region holds no pixel at all.
 */
export function averageLuminance(pixels: Pixels, region: Box): number | null {
  const columns = Math.min(MAX_SAMPLES, Math.max(1, Math.round(region.right - region.left)))
  const rows = Math.min(MAX_SAMPLES, Math.max(1, Math.round(region.bottom - region.top)))
  const stepX = (region.right - region.left) / columns
  const stepY = (region.bottom - region.top) / rows

  let total = 0
  let count = 0
  for (let row = 0; row < rows; row++) {
    const y = Math.min(pixels.height - 1, Math.floor(region.top + stepY * (row + 0.5)))
    for (let column = 0; column < columns; column++) {
      const x = Math.min(pixels.width - 1, Math.floor(region.left + stepX * (column + 0.5)))
      if (x < 0 || y < 0) continue
      const at = (y * pixels.width + x) * 4
      total += luminance(pixels.data[at] ?? 0, pixels.data[at + 1] ?? 0, pixels.data[at + 2] ?? 0)
      count++
    }
  }
  return count === 0 ? null : total / count
}
