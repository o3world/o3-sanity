import type { ButtonHTMLAttributes } from 'react'

import { cn } from '../lib/utils'

export interface CarouselControlProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Which way the arrow points. `prev` is the same glyph, rotated. */
  direction: 'prev' | 'next'
}

/**
 * The circular prev/next control beside a carousel heading — Figma's
 * `Icon / Surface` (`778:1862`), which `docs/figma-components.md` listed as
 * "to build" and assigned to #42.
 *
 * It is a component nested inside a component: a 58px `#D3D3D3` circle
 * (`bg/button/secondary`) holding `Icon / Soft` (`1203:1227`), a 34.8px chip
 * of the same fill stroked at 1.45px with a **5.8px** radius — the only real
 * curve on an otherwise square page, which is why the radius is a literal here
 * rather than a token (packages/tailwind-config → "what earns a token").
 *
 * Figma ships this set with a `State=Hover` variant. Per ADR 0008 that is a
 * pseudo-class, not a cva variant, so it is a `hover:` utility.
 */
export function CarouselControl({ direction, className, ...rest }: CarouselControlProps) {
  return (
    <button
      type="button"
      aria-label={direction === 'prev' ? 'Previous' : 'Next'}
      className={cn(
        'bg-surface-muted duration-(--duration-hover) focus-visible:ring-brand flex size-[58px] shrink-0 items-center justify-center rounded-full transition-opacity ease-out hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40',
        className,
      )}
      {...rest}
    >
      <span className="bg-surface-muted border-surface-muted text-ink flex size-[34.8px] items-center justify-center rounded-[5.8px] border-[1.45px]">
        <svg
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={direction === 'prev' ? 'rotate-180' : undefined}
        >
          <line x1="4" y1="12" x2="20" y2="12" />
          <polyline points="13 5 20 12 13 19" />
        </svg>
      </span>
    </button>
  )
}
