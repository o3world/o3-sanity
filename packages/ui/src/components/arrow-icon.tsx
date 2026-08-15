import type { SVGProps } from 'react'

export interface ArrowIconProps extends SVGProps<SVGSVGElement> {
  /** Rendered width/height in px. The frames draw the glyph at 20. */
  size?: number
}

/**
 * The O3 arrow — a long shaft + chevron head. Figma's `Icon=arrow-right`
 * (`2177:1559`), the default fill of the button's icon slot and what every
 * "View our work" / "Read the case" / "Let's talk" CTA in the file carries.
 * Strokes with currentColor so it follows the surrounding text color.
 *
 * **20px by default** — the `Button` set (`2134:1785`) draws its trailing icon
 * in a 20×20 wrapper, which is the whole of the `Icon` set's own frame size.
 */
export function ArrowIcon({ size = 20, className, ...rest }: ArrowIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="13 5 20 12 13 19" />
    </svg>
  )
}
