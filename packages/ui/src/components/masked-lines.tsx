'use client'

import { useEffect, useState, type ReactNode } from 'react'

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

const EASING_CLASS = {
  mask: 'ease-mask',
  spring: 'ease-spring',
} as const

/**
 * The hero headline's line-mask reveal: each line slides up from behind an
 * overflow mask on mount (`.o3-mask` / `.o3-line`, 0.95s). Implemented as a
 * mount-triggered transition rather than keyframes so the timing tokens stay
 * in the class list, and so `motion-reduce:` can show the text immediately.
 *
 * The text is in the server HTML and only its position is animated, so a
 * headline is readable whether or not the class flip ever happens.
 */
export function MaskedLines({
  lines,
  baseDelay = 0,
  stagger = 170,
  easing = 'mask',
}: MaskedLinesProps) {
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    // One frame later so the initial translate paints before transitioning.
    const raf = requestAnimationFrame(() => setRevealed(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <>
      {lines.map((line, i) => (
        // The 0.04em bottom padding keeps descenders inside the mask.
        <span key={i} className="block overflow-hidden pb-[0.04em]">
          <span
            className={cn(
              EASING_CLASS[easing],
              // `translate`, not `transform`, in all three: Tailwind v4
              // compiles `translate-y-*` to the independent `translate`
              // property, which is what has to be transitioned, hinted, and
              // cancelled (see `../motion.ts`).
              'duration-(--duration-mask) block transition-[translate] [will-change:translate]',
              'motion-reduce:translate-none motion-reduce:transition-none',
              revealed ? 'translate-y-0' : 'translate-y-[110%]',
            )}
            style={{ transitionDelay: `${baseDelay + i * stagger}ms` }}
          >
            {line}
          </span>
        </span>
      ))}
    </>
  )
}
