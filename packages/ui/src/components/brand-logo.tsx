import type { SVGProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@o3/ui/lib/utils'

/**
 * The mark's geometry, drawn once and shared by both exports below.
 *
 * `BrandLogo` knocks these two paths out of a filled square in white;
 * `BrandMark` renders the same two paths on their own in `currentColor`. Same
 * `d`, same 64 box, same optical size — "exact branding" is a property of this
 * file rather than something two components have to be kept agreeing on.
 */
function MarkPaths({ fill }: { fill: string }) {
  return (
    <>
      {/* The superscript 3. */}
      <path
        d="M51.8837 53.5317C51.0819 53.5317 50.3868 53.0748 50.3566 52.0668H48.3086C48.3388 54.4135 50.0561 55.3753 51.8819 55.3753C53.8019 55.3753 55.441 54.2713 55.441 52.0366C55.441 50.6819 54.7957 49.9104 53.9921 49.4855C54.7317 49.0908 55.2828 48.3993 55.2828 47.1868C55.2828 45.297 53.8499 43.9744 51.8659 43.9744C49.8819 43.9744 48.481 45.1708 48.433 47.1708H50.4793C50.5273 46.3193 51.0944 45.8179 51.8659 45.8179C52.6375 45.8179 53.2366 46.305 53.2366 47.2508C53.2366 48.0384 52.8117 48.6517 51.8179 48.6517H51.5193V50.433H51.8179C52.8277 50.433 53.393 51.0464 53.393 51.9761C53.393 52.9824 52.7637 53.5353 51.8819 53.5353L51.8837 53.5317Z"
        fill={fill}
      />
      {/* The O ring. */}
      <path
        d="M16.6016 31.9867C16.6016 40.4738 23.5082 47.3805 31.9953 47.3805C40.4825 47.3805 47.3891 40.4756 47.3891 31.9867C47.3891 23.4978 40.4842 16.5947 31.9953 16.5947C23.5065 16.5947 16.6016 23.4996 16.6016 31.9867ZM41.1918 31.9867C41.1918 37.057 37.0673 41.1849 31.9953 41.1849C26.9233 41.1849 22.7989 37.0587 22.7989 31.9867C22.7989 26.9147 26.9251 22.7903 31.9953 22.7903C37.0656 22.7903 41.1918 26.9147 41.1918 31.9867Z"
        fill={fill}
      />
    </>
  )
}

/**
 * The mark's own bounds inside the 64 box, read off the two path `d` strings
 * above: x 16.6016–55.4410, y 16.5947–55.3753. `BrandMark`'s `trim` renders
 * through this instead of the full box; nothing else needs it.
 */
const MARK_BOUNDS = '16.6016 16.5947 38.8394 38.7806'

/**
 * The O3 mark — Figma's `Brand / Logo` component set (`264:50`).
 *
 * A filled square with the ring-and-superscript mark knocked out in white.
 * The square is the component: Figma's own note on the set says "use the scale
 * tool … to preserve the square aspect ratio", so this takes one `size` and
 * stays square rather than exposing width and height.
 *
 * `currentColor` fills the square, so the `color` variant is a text color and
 * the marks stay white in every variant the canonical frames use.
 */
const brandLogoVariants = cva('block shrink-0', {
  variants: {
    /** Figma axis `Color`. */
    color: {
      /** `264:52` — `#030303` (`Jawn/Primary/Schuylkill`). */
      black: 'text-ink-deep',
      /**
       * `264:51` — `#EB1000`. Drew the footer at 176px until the 2026-08
       * `Footer` (`1280:1885`) dropped the plate — see `BrandMark` below.
       */
      red: 'text-brand',
    },
  },
  defaultVariants: { color: 'black' },
})

export interface BrandLogoProps
  extends Omit<SVGProps<SVGSVGElement>, 'color'>, VariantProps<typeof brandLogoVariants> {
  /** Rendered edge length in px. 64 in the NavBar, 176 in the footer. */
  size?: number
}

/**
 * The set's third variant, `Color=White`, is deliberately absent: no canonical
 * Design Concept frame instances it, so its knockout color would be a guess.
 * Add it when a frame calls for it (ADR 0008 — Figma decides the variants).
 *
 * It briefly shipped, on a misread of the direction that made the nav's mark
 * reverse with the surface — the answer to that turned out to be `BrandMark`
 * below, not an inverted tile, and an inverted tile has no caller. The tile
 * itself has never flipped anywhere and does not now.
 *
 * The 2026-08 `Footer` (`1280:1885`) draws a white logo and still does not call
 * for it: that logo is the two paths alone, tight-bounded, with no plate at all
 * (`1280:1856`) — `BrandMark`, not a white tile. #87.
 */
export function BrandLogo({ size = 64, color, className, ...rest }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cn(brandLogoVariants({ color, className }))}
      {...rest}
    >
      <rect width="64" height="64" fill="currentColor" />
      <MarkPaths fill="white" />
    </svg>
  )
}

export interface BrandMarkProps extends SVGProps<SVGSVGElement> {
  /**
   * Rendered box edge in px — the same box `BrandLogo` fills, minus the fill.
   * Under `trim`, the drawn mark itself.
   */
  size?: number
  /** Crop the box to the mark's own bounds, as Figma's footer vector is. */
  trim?: boolean
}

/**
 * The O3 mark **without its plate** — the ring and the superscript alone, in
 * `currentColor`.
 *
 * NO COMPONENT SET DRAWS THIS — `Brand / Logo` is a square in all three of its
 * variants. It was built ahead of any Figma node, on two anchors:
 *
 * - Nick's direction, 2026-08-02: "the color of o3 changes so it's visible,
 *   without the square box".
 * - The prototype's nav, which draws exactly this — a stroked ring plus a `3`,
 *   free-standing, flipping between `#fff` and `#232323` as the bar crosses a
 *   band. Intent and sequence from a prototype is the sanctioned use of one
 *   (AGENTS.md); the geometry here is still Figma's, path for path.
 *
 * The 2026-08 `Footer` (`1280:1885`) then drew it — a plate-less white vector
 * of these two paths (`1280:1856`) — which settles the direction against a
 * canonical node rather than an interpretation of one (#87).
 *
 * It keeps the 64 viewBox by default. The mark occupies the same region of
 * that box it occupied inside the tile, so swapping `BrandLogo` for `BrandMark`
 * at the same `size` removes the plate and moves nothing else.
 *
 * `trim` is for callers whose Figma node is bounded to the mark rather than to
 * the tile — the footer's vector is 148px of ink flush with the container's
 * left edge, where the tile's margin would inset it by 25.9% of `size` on two
 * sides. It crops the viewBox to `MARK_BOUNDS`, making `size` the drawn mark.
 *
 * There is no `color` variant and there should not be: the whole point is that
 * the surrounding surface decides the ink. Give it a text color, or let it
 * inherit one — `SiteNav` inherits, so the mark rides the bar's own ink
 * transition without a second rule.
 */
export function BrandMark({ size = 64, trim = false, className, ...rest }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={trim ? MARK_BOUNDS : '0 0 64 64'}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={cn('block shrink-0', className)}
      {...rest}
    >
      <MarkPaths fill="currentColor" />
    </svg>
  )
}

export { brandLogoVariants }
