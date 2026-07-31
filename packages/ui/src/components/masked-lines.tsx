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
}

/**
 * The hero headline's line-mask reveal: each line slides up from behind an
 * overflow mask on mount (`.o3-mask` / `.o3-line`, 0.95s on the mask curve).
 * Implemented as a mount-triggered transition rather than keyframes so the
 * timing tokens (`ease-mask`) stay in the class list, and so
 * `motion-reduce:` can show the text immediately.
 */
export function MaskedLines({ lines, baseDelay = 0, stagger = 170 }: MaskedLinesProps) {
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
              'ease-mask block transition-transform duration-[950ms] will-change-transform',
              'motion-reduce:transform-none motion-reduce:transition-none',
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
