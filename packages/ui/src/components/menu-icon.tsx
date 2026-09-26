import type { SVGProps } from 'react'

export interface MenuIconProps extends SVGProps<SVGSVGElement> {
  size?: number
}

/** Current mobile menu glyph (2177:1600), centered in the 20px icon slot. */
export function MenuIcon({ size = 20, className, ...rest }: MenuIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path
        transform="translate(3.333333 4.166666)"
        d="M0 -1L-1 -1L-1 1L0 1L0 0L0 -1ZM13.3333 1L14.3333 1L14.3333 -1L13.3333 -1L13.3333 0L13.3333 1ZM0 4.83333L-1 4.83333L-1 6.83333L0 6.83333L0 5.83333L0 4.83333ZM13.3333 6.83333L14.3333 6.83333L14.3333 4.83333L13.3333 4.83333L13.3333 5.83333L13.3333 6.83333ZM0 10.6667L-1 10.6667L-1 12.6667L0 12.6667L0 11.6667L0 10.6667ZM13.3333 12.6667L14.3333 12.6667L14.3333 10.6667L13.3333 10.6667L13.3333 11.6667L13.3333 12.6667ZM0 0L0 1L13.3333 1L13.3333 0L13.3333 -1L0 -1L0 0ZM0 5.83333L0 6.83333L13.3333 6.83333L13.3333 5.83333L13.3333 4.83333L0 4.83333L0 5.83333ZM0 11.6667L0 12.6667L13.3333 12.6667L13.3333 11.6667L13.3333 10.6667L0 10.6667L0 11.6667Z"
      />
    </svg>
  )
}
