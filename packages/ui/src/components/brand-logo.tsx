import type { SVGProps } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@o3/ui/lib/utils'

/**
 * The O3 mark — Figma's `Brand / Logo` component set (`264:50`).
 *
 * A filled square with the ring-and-superscript mark knocked out in white.
 * The square is the component: Figma's own note on the set says "use the scale
 * tool … to preserve the square aspect ratio", so this takes one `size` and
 * stays square rather than exposing width and height.
 *
 * `currentColor` fills the square, so the `color` variant is a text color. The
 * counterforms — the ring and the superscript knocked out of it — read
 * `--logo-counterform`, defaulting to white, which is what every frame draws.
 * Two inks rather than one because `Color=White` inverts the pair rather than
 * recolouring the square: see the note under the variants.
 *
 * Both inks transition over `--duration-ink`. That is the prototype's own
 * timing on this mark — its nav script gives the ring `transition: stroke
 * 0.35s ease` and the superscript `transition: fill 0.35s ease` — and it is
 * inert anywhere the colour never changes, which is everywhere but the nav.
 */
const brandLogoVariants = cva(
  'duration-(--duration-ink) block shrink-0 transition-colors ease-out',
  {
    variants: {
      /** Figma axis `Color`. */
      color: {
        /** `264:52` — `#030303` (`Jawn/Primary/Schuylkill`). The NavBar mark. */
        black: 'text-ink-deep',
        /** `264:51` — `#EB1000`. The footer mark, at 176px. */
        red: 'text-brand',
        /**
         * `264:53` — the set's third variant, and the one no canonical Design
         * Concept frame instances. It ships anyway, on Nick's direction
         * (2026-08-02): the mark reverses with the surface — white against dark
         * bands, black against light — while maintaining exact branding. So the
         * geometry is untouched and only the colourway inverts: a white square
         * with `--color-ink-deep` counterforms, the exact mirror of `264:52`'s
         * ink square with white ones. Nothing here is invented; the pair of
         * values is already the black variant's, swapped.
         */
        white: 'text-white [--logo-counterform:var(--color-ink-deep)]',
      },
    },
    defaultVariants: { color: 'black' },
  },
)

export interface BrandLogoProps
  extends Omit<SVGProps<SVGSVGElement>, 'color'>, VariantProps<typeof brandLogoVariants> {
  /** Rendered edge length in px. 64 in the NavBar, 176 in the footer. */
  size?: number
}

/**
 * The counterforms are one `<g>`, not two `fill="white"` attributes, so a
 * caller can retarget both with a single custom property and they can never
 * drift apart. `var(--logo-counterform, white)` means every instance that sets
 * nothing renders exactly what it rendered before the property existed — the
 * footer's red mark included.
 *
 * The indirection exists for the nav's ink flip, which has to move both inks
 * from CSS hanging off one `data-` attribute while the bar animates
 * (`SiteNav`). `fill` substituted from a custom property still transitions:
 * substitution happens at computed-value time, so the `<g>`'s fill goes white →
 * `#030303` as a normal transition and the paths inherit it mid-interpolation.
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
      {/* The counterforms, knocked out of the square as one ink. */}
      <g
        fill="var(--logo-counterform, white)"
        className="duration-(--duration-ink) transition-[fill] ease-out"
      >
        {/* The superscript 3. */}
        <path d="M51.8837 53.5317C51.0819 53.5317 50.3868 53.0748 50.3566 52.0668H48.3086C48.3388 54.4135 50.0561 55.3753 51.8819 55.3753C53.8019 55.3753 55.441 54.2713 55.441 52.0366C55.441 50.6819 54.7957 49.9104 53.9921 49.4855C54.7317 49.0908 55.2828 48.3993 55.2828 47.1868C55.2828 45.297 53.8499 43.9744 51.8659 43.9744C49.8819 43.9744 48.481 45.1708 48.433 47.1708H50.4793C50.5273 46.3193 51.0944 45.8179 51.8659 45.8179C52.6375 45.8179 53.2366 46.305 53.2366 47.2508C53.2366 48.0384 52.8117 48.6517 51.8179 48.6517H51.5193V50.433H51.8179C52.8277 50.433 53.393 51.0464 53.393 51.9761C53.393 52.9824 52.7637 53.5353 51.8819 53.5353L51.8837 53.5317Z" />
        {/* The O ring. */}
        <path d="M16.6016 31.9867C16.6016 40.4738 23.5082 47.3805 31.9953 47.3805C40.4825 47.3805 47.3891 40.4756 47.3891 31.9867C47.3891 23.4978 40.4842 16.5947 31.9953 16.5947C23.5065 16.5947 16.6016 23.4996 16.6016 31.9867ZM41.1918 31.9867C41.1918 37.057 37.0673 41.1849 31.9953 41.1849C26.9233 41.1849 22.7989 37.0587 22.7989 31.9867C22.7989 26.9147 26.9251 22.7903 31.9953 22.7903C37.0656 22.7903 41.1918 26.9147 41.1918 31.9867Z" />
      </g>
    </svg>
  )
}

export { brandLogoVariants }
