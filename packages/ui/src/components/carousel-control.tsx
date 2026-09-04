import type { ButtonHTMLAttributes } from 'react'

import { cn } from '../lib/utils'

import { ArrowIcon } from './arrow-icon'

export interface CarouselControlProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Which way the arrow points. `prev` is the same glyph, rotated. */
  direction: 'prev' | 'next'
}

/**
 * The 48px Icon Button beside a carousel heading, with the shared 5px button
 * radius (Home Blog `2134:1352`, instances `2209:2555` and `2209:2546`).
 * Native button state and the carousel own interaction; this owns the arrow.
 */
export function CarouselControl({ direction, className, ...rest }: CarouselControlProps) {
  return (
    <button
      type="button"
      aria-label={direction === 'prev' ? 'Previous' : 'Next'}
      className={cn(
        'bg-surface-muted duration-(--duration-hover) focus-visible:ring-brand text-ink rounded-btn flex size-12 shrink-0 items-center justify-center transition-opacity ease-out hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-40',
        className,
      )}
      {...rest}
    >
      <ArrowIcon className={direction === 'prev' ? 'rotate-180' : undefined} />
    </button>
  )
}
