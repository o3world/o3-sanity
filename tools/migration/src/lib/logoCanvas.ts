/**
 * Sitting a borrowed logo on a common optical size.
 *
 * `LogoWallSection` draws every mark `w-full` inside a fixed tile — 152px of
 * artwork box at 1440 — so a logo's rendered height is decided entirely by its
 * own proportions. That is fine while the marks are all wordmarks of a similar
 * shape (the eight partner PNGs run 3.9:1 to 6.4:1) and falls apart the moment
 * a 2:1 mark stands next to an 8.8:1 one: Figma would draw three times the
 * height of athenahealth.
 *
 * So the artwork is normalised rather than the component. Each mark is centred
 * on one canvas of fixed proportions and fitted inside a box on it — the same
 * idiom `LogoTile` already uses in CSS (`max-h-[76px] max-w-[78%]`), moved to
 * the asset so the tile can keep filling its width.
 *
 * Pure and deterministic: the same source bytes always produce the same output,
 * which is what lets `brand-assets` treat a changed file as a vendor change
 * rather than as noise from this step.
 */

/** The canvas a mark is centred on, and the box it is fitted inside. */
export interface LogoCanvas {
  readonly width: number
  readonly height: number
  readonly boxWidth: number
  readonly boxHeight: number
}

/**
 * The partner strip's canvas.
 *
 * 480 × 140 is 3.43:1 — near enough the existing marks' average that the band
 * keeps its proportions. The box inside it is 440 × 88, so a mark wider than
 * 5:1 fills the width and everything narrower is capped at 88, which lands the
 * whole set between 16px and 28px tall in the 152px tile. That is inside the
 * 24–39px the eight committed PNGs already draw.
 */
export const PARTNER_STRIP: LogoCanvas = {
  width: 480,
  height: 140,
  boxWidth: 440,
  boxHeight: 88,
}

/** What the source file says its own dimensions are. */
export interface SvgSize {
  readonly width: number
  readonly height: number
}

const ROOT_TAG = /<svg\b([^>]*)>/i

function attribute(attrs: string, name: string): string | null {
  const match = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, 'i').exec(attrs)
  return match ? match[1]! : null
}

/** A length as a number, ignoring a `px` suffix — `%` and `em` are not sizes we can use. */
function length(value: string | null): number | null {
  if (!value) return null
  const match = /^\s*(-?[\d.]+)(px)?\s*$/.exec(value)
  const parsed = match ? Number(match[1]) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

/**
 * The user-space box the source draws in — its `viewBox` where it has one, its
 * `width`/`height` otherwise. A file with neither cannot be placed, and that is
 * an error rather than a guess: a wrong box silently crops the mark.
 */
export function svgSize(svg: string): SvgSize {
  const root = ROOT_TAG.exec(svg)
  if (!root) throw new Error('not an SVG: no <svg> element')
  const attrs = root[1]!
  const viewBox = attribute(attrs, 'viewBox')
  if (viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    if (parts.length === 4 && parts.every(Number.isFinite) && parts[2]! > 0 && parts[3]! > 0) {
      return { width: parts[2]!, height: parts[3]! }
    }
  }
  const width = length(attribute(attrs, 'width'))
  const height = length(attribute(attrs, 'height'))
  if (width && height) return { width, height }
  throw new Error('SVG carries neither a usable viewBox nor width/height')
}

/** Where a mark of this shape sits on the canvas, fitted inside its box. */
export function placement(size: SvgSize, canvas: LogoCanvas) {
  const scale = Math.min(canvas.boxWidth / size.width, canvas.boxHeight / size.height)
  const width = size.width * scale
  const height = size.height * scale
  return {
    width,
    height,
    x: (canvas.width - width) / 2,
    y: (canvas.height - height) / 2,
  }
}

/** Three decimals is under a thousandth of a pixel at the size these render. */
const round = (n: number) => Number(n.toFixed(3))

/**
 * The source SVG, centred on `canvas` as a nested `<svg>`.
 *
 * Nesting rather than wrapping in a `<g transform>`: the inner element keeps
 * its own `viewBox`, so its coordinate system is untouched and nothing inside
 * it — clip paths, gradients, `fill-rule` — has to be re-expressed. The outer
 * element carries the dimensions Sanity reads off the uploaded file, which is
 * what makes every tile in the strip lay out identically.
 */
export function normalizeLogoSvg(svg: string, canvas: LogoCanvas = PARTNER_STRIP): string {
  const size = svgSize(svg)
  const box = placement(size, canvas)

  const root = ROOT_TAG.exec(svg)!
  // Everything before the root element is an XML declaration, a doctype or a
  // comment; the outer element replaces all of it.
  const body = svg.slice(root.index + root[0].length)
  const inner = root[1]!
    .replace(/\s+(width|height|x|y)\s*=\s*"[^"]*"/gi, '')
    .replace(/\s+xmlns\s*=\s*"[^"]*"/gi, '')
    .trim()
  const viewBox = attribute(root[1]!, 'viewBox')
    ? ''
    : ` viewBox="0 0 ${size.width} ${size.height}"`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}"` +
    ` viewBox="0 0 ${canvas.width} ${canvas.height}" fill="none">` +
    `<svg x="${round(box.x)}" y="${round(box.y)}" width="${round(box.width)}"` +
    ` height="${round(box.height)}"${viewBox}${inner ? ` ${inner}` : ''}>` +
    body +
    `</svg>\n`
  )
}

/**
 * The darkest ink in an SVG, as relative luminance (0 black, 1 white), or
 * `null` for a file that names no colour at all.
 *
 * The strip sits on the warm wash and desaturates every mark, so a logo has to
 * arrive dark to survive both. Sanity publishes some of its customer marks in a
 * muted grey for use on its own dimmed rows — PUMA's `9a1e5c00…` is `#9EA6B3` —
 * and dropped into a tile that one reads as a mistake rather than a logo. This
 * is what tells the two apart before the file is committed.
 *
 * Deliberately crude: hex fills only. A mark whose ink is in a gradient or a
 * stylesheet reports `null` and is passed, because the alternative is a colour
 * parser nobody asked for guessing at files this set does not contain.
 */
export function darkestInk(svg: string): number | null {
  let darkest: number | null = null
  for (const [, hex] of svg.matchAll(/fill="#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})"/g)) {
    const full = hex!.length === 3 ? [...hex!].map((c) => c + c).join('') : hex!
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as [
      number,
      number,
      number,
    ]
    // Rec. 601 luma: close enough to how dark a mark looks once the tile's
    // `grayscale` has flattened it, which is the question being asked.
    const luma = 0.299 * r + 0.587 * g + 0.114 * b
    if (darkest === null || luma < darkest) darkest = luma
  }
  return darkest
}

/**
 * How light the darkest ink may be. `#9EA6B3` is 0.64 and `#272A2E` is 0.16, so
 * 0.4 separates a real mark from a dimmed one with room on both sides.
 */
export const MAX_INK_LUMA = 0.4
