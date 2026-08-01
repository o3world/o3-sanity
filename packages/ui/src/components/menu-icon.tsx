import type { SVGProps } from 'react'

export interface MenuIconProps extends SVGProps<SVGSVGElement> {
  /** Rendered width/height in px. The 402 nav draws it in a 42px box. */
  size?: number
}

/**
 * The 402 nav's "Open menu" affordance (`1814:1636`).
 *
 * Not a Material Symbols glyph — the mobile frame draws it by hand as **two**
 * 24×1.5 bars, 5px apart, right-aligned inside a 42×42 box, at
 * `rgba(255,255,255,0.85)`. (ADR 0009 describes it as three bars in passing;
 * the frame has two — `1814:1637` and `1814:1638`.)
 *
 * Two bars rather than the conventional three is the design's, so it is kept.
 * Fills with `currentColor` so it follows the bar's text color.
 */
export function MenuIcon({ size = 42, className, ...rest }: MenuIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 42 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {/* Right-aligned: 42 − 24 = x 18. Centred vertically about the 5px gap. */}
      <rect x="18" y="18.75" width="24" height="1.5" fill="currentColor" />
      <rect x="18" y="25.25" width="24" height="1.5" fill="currentColor" />
    </svg>
  )
}
