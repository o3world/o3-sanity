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
 * fold needs this.** `Reveal` waits on an IntersectionObserver, so its content
 * is transparent until the bundle lands; that is the right trade below the
 * fold, where nobody is looking yet, and the wrong one in the opener, whose
 * copy is what the page is judged on at first paint. A CSS animation in the
 * server HTML needs no JavaScript at all, so there is nothing to wait for and
 * no `noscript` rule to write.
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
