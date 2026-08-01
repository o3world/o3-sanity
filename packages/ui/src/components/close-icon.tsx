import type { SVGProps } from 'react'

export interface CloseIconProps extends SVGProps<SVGSVGElement> {
  /** Rendered width/height in px. Buttons draw their glyphs at 20 (`136:14`). */
  size?: number
}

/**
 * Material Symbols Outlined `close`, inlined (ADR 0009).
 *
 * The second glyph the canonical frames use — the file carries it as `close`
 * (`400:2219`). Drawn on the 24px Material grid and filled with `currentColor`.
 */
export function CloseIcon({ size = 20, className, ...rest }: CloseIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 -960 960 960"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
    </svg>
  )
}
