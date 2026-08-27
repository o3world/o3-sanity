'use client'

import { useEffect, useRef, useState, type HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  /** ms transition delay — the prototype staggers logo-wall tiles by 80ms. */
  delay?: number
}

/**
 * The prototype's `[data-reveal]` treatment: start faded 24px down, fade up
 * over 700ms on the house curve when the element scrolls into view
 * (IntersectionObserver, -40px bottom margin). Elements already in the
 * viewport on mount show immediately, and prefers-reduced-motion skips the
 * animation entirely.
 *
 * The element carries `data-reveal`, which is what each app's root layout
 * targets from a `noscript` rule: with no JavaScript the effect never runs, so
 * the stylesheet has to be the thing that shows the content.
 */
export function Reveal({ delay = 0, className, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  const [instant, setInstant] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShown(true)
      return
    }
    // An element taller than the viewport is never seen entering as a whole,
    // and animating one costs more than it shows: while it fades, the page's
    // ground reads through its half-opaque paint (a dark flash under a white
    // band on the ink page), the rise leaves that ground as a seam above it,
    // and the in-flight translate makes it a containing block under any
    // sticky machinery it holds. Shown at once, untransitioned.
    if (el.offsetHeight > window.innerHeight) {
      setInstant(true)
      setShown(true)
      return
    }
    // Prototype behavior: anything already at/above the viewport shows
    // immediately instead of waiting to re-enter.
    if (el.getBoundingClientRect().top < window.innerHeight) {
      setShown(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      data-reveal=""
      className={cn(
        // `translate`, not `transform`: Tailwind v4 compiles `translate-y-*`
        // to the independent `translate` property, which a transition naming
        // `transform` does not reach (see `../motion.ts`).
        instant
          ? 'transition-none'
          : 'duration-(--duration-reveal) transition-[opacity,translate] ease-out',
        'motion-reduce:transition-none',
        // `translate-none` rather than `translate-y-0`: a settled reveal must
        // leave no translation behind, because any value but `none` makes the
        // element a containing block for the fixed and sticky descendants a
        // band may hold.
        shown ? 'translate-none opacity-100' : 'translate-y-6 opacity-0',
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms`, ...style } : style}
      {...rest}
    >
      {children}
    </div>
  )
}
