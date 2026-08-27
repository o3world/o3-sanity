import type { HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

export type SkeletonProps = HTMLAttributes<HTMLDivElement>

/**
 * A blank block standing in for content that has not arrived — the shape a
 * streamed route holds while its data is still in flight.
 *
 * NO FIGMA ANCHOR, AND THERE CANNOT BE ONE: the frames draw arrived pages, so
 * nothing in them says what the wait looks like. What it borrows instead is
 * `surface-muted`, the grey the light bands already use for an inert control.
 *
 * Size and shape are the caller's — this draws a bar, and the fallback that
 * uses it decides whether that bar is a card, a title or a meta line. It is
 * `aria-hidden` because it says nothing: a screen reader hears the real
 * content when it lands, and the pulse stops under reduced motion.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'bg-surface-muted animate-pulse rounded-sm motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  )
}
