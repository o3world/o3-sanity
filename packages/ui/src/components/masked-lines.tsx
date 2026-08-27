import type { ReactNode } from 'react'

import { cn } from '../lib/utils'

export interface MaskedLinesProps {
  /** One entry per visual line; each renders inside its own overflow mask. */
  lines: readonly ReactNode[]
  /** ms before the first line starts revealing. */
  baseDelay?: number
  /** ms between successive lines (prototype: 1.55s → 1.72s = 170ms). */
  stagger?: number
  /**
   * Which curve the lines ride. `mask` is the prototype's; `spring` starts
   * from rest and settles on a long tail, which is what an editorial stagger
   * reads as when the lines are spaced far enough apart to be read one at a
   * time.
   */
  easing?: 'mask' | 'spring'
}

const ANIMATION_CLASS = {
  mask: 'animate-line-lift',
  spring: 'animate-line-lift-spring',
} as const

/**
 * The hero headline's line-mask reveal: each line slides up from behind an
 * overflow mask (`.o3-mask` / `.o3-line`, 0.95s), staggered.
 *
 * **The entrance is a CSS animation, and this component renders on the
 * server.** The headline is the page's LCP element, so its reveal has to start
 * when the band first paints rather than when React hydrates — an animation
 * declared in the server HTML does; a mount-triggered transition cannot, and
 * held the opener empty for the whole hydration window. Timing tokens stay in
 * the class list either way, and `motion-reduce:` still shows the text
 * immediately.
 *
 * The text is in the server HTML and only its position is animated, so a
 * headline is readable whether or not JavaScript ever runs.
 */
export function MaskedLines({
  lines,
  baseDelay = 0,
  stagger = 170,
  easing = 'mask',
}: MaskedLinesProps) {
  return (
    <>
      {lines.map((line, i) => (
        // The 0.04em bottom padding keeps descenders inside the mask.
        <span key={i} className="block overflow-hidden pb-[0.04em]">
          <span
            className={cn(
              ANIMATION_CLASS[easing],
              // `translate`, not `transform`: Tailwind v4 compiles
              // `translate-y-*` to the independent `translate` property, which
              // is what the keyframe writes and what has to be hinted and
              // cancelled (see `../motion.ts`).
              'block [will-change:translate]',
              'motion-reduce:animate-none',
            )}
            style={{ animationDelay: `${baseDelay + i * stagger}ms` }}
          >
            {line}
          </span>
        </span>
      ))}
    </>
  )
}
