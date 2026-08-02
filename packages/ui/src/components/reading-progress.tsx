'use client'

import { useEffect, useRef } from 'react'

import { cn } from '../lib/utils'

export interface ReadingProgressProps {
  className?: string
}

/**
 * The scroll-progress bar an article carries — a hairline of brand red pinned
 * to the top of the viewport, filling left to right as the page scrolls.
 *
 * **Spec source is the precursor `1379:2367`, not the canonical frame.** The
 * canonical Insights frame omits it, as a static frame must: it is a behaviour,
 * and Figma cannot draw one. #45 licenses exactly two things out of the
 * html.to.design import — this and the back-link — and nothing else, so the
 * only values taken from it are the ones the behaviour cannot exist without:
 * a bar at the very top, 3px, in the brand red. Everything else here (the
 * gradient, the token, the transform) comes from the canonical vocabulary.
 *
 * ## Why a transform rather than a width
 *
 * The bar is a full-width element scaled on its X axis from the left origin,
 * so a scroll updates a composited property and never triggers layout. Writing
 * a CSS custom property straight onto the node — rather than `setState` —
 * keeps the whole thing off React's render path: a scroll to the bottom of a
 * 6,000px article would otherwise be a few hundred renders of the page's only
 * client component.
 *
 * Decorative, so `aria-hidden`: it reports what the scrollbar already reports,
 * and a `progressbar` role would put a value in the accessibility tree that
 * changes on every pixel of scroll.
 */
export function ReadingProgress({ className }: ReadingProgressProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    const paint = () => {
      frame = 0
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - window.innerHeight
      // A page shorter than the viewport has no progress to report; leave the
      // bar empty rather than dividing by zero into a full red band.
      const progress = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
      el.style.setProperty('--reading-progress', String(progress))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint)
    }

    paint()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]', className)}
    >
      <div
        ref={ref}
        className="bg-brand h-full w-full origin-left scale-x-[var(--reading-progress,0)]"
        style={{ ['--reading-progress' as string]: 0 }}
      />
    </div>
  )
}
