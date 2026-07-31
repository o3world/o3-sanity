import type { SVGProps } from 'react'

export interface ArrowIconProps extends SVGProps<SVGSVGElement> {
  /** Rendered width/height in px. The prototype uses 15 everywhere. */
  size?: number
}

/**
 * The O3 arrow — a long shaft + chevron head, traced from the prototype's
 * inline SVG (every "View our work" / "Read the case" / "Let's talk" CTA).
 * Strokes with currentColor so it follows the surrounding text color.
 */
export function ArrowIcon({ size = 15, className, ...rest }: ArrowIconProps) {
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
