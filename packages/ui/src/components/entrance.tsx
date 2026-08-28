import type { HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

export interface EntranceProps extends HTMLAttributes<HTMLDivElement> {
  /** ms before the fade-up starts, measured from the element's first paint. */
  delay?: number
}

/**
 * The load entrance: fade up 24px, once, starting when the element first
 * paints. Same 24px and same house curve as `Reveal` — the difference is what
 * starts it.
 *
 * **`Reveal` is the scroll one, this is the load one, and a band above the
 * fold that wants an entrance needs this.** `Reveal` leaves first-viewport
 * content exactly as the server painted it — its animation belongs to bands
 * the reader scrolls to. A CSS animation in the server HTML starts at first
 * paint with no JavaScript at all, which is the only way an opener can move
 * without first standing still.
 */
export function Entrance({ delay = 0, className, style, children, ...rest }: EntranceProps) {
  return (
    <div
      className={cn('animate-fade-up motion-reduce:animate-none', className)}
      style={delay ? { animationDelay: `${delay}ms`, ...style } : style}
      {...rest}
    >
      {children}
    </div>
  )
}
