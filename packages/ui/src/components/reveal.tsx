'use client'

import { useEffect, useRef, useState, type HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

export interface RevealProps extends HTMLAttributes<HTMLDivElement> {
  /** ms transition delay — the prototype staggers logo-wall tiles by 80ms. */
  delay?: number
}

type Phase = 'static' | 'armed' | 'entered'

/**
 * The prototype's `[data-reveal]` treatment, inverted so the server HTML is
 * complete: content ships visible, and the entrance is a client enhancement
 * applied only to elements the reader has not seen yet. After hydration, an
 * element still below the viewport is hidden (24px down, faded) and fades up
 * over 700ms on the house curve when it scrolls into view
 * (IntersectionObserver, -40px bottom margin).
 *
 * Everything else keeps the server's paint, untransitioned: an element in or
 * above the first viewport — the reader is already looking at it, and blanking
 * it until hydration is the load flash this inversion removes; an element
 * taller than the viewport — while it fades, the page's ground reads through
 * its half-opaque paint, the rise leaves that ground as a seam above it, and
 * the in-flight translate makes it a containing block under any sticky
 * machinery it holds; and everything under prefers-reduced-motion. With no
 * JavaScript the effect never runs and the page is simply the server's, so no
 * `noscript` rule is needed.
 *
 * **Two elements: the outer stands still, the inner fades.** `className` and
 * every spread prop land on the outer, which is what lets a caller paint it
 * with the band's own ground (`SectionReveal` does) — an entrance that faded
 * its own background would rise out of whatever sits behind the page, dark
 * ground under a light band. Only the inner element ever carries opacity or
 * translate.
 */
export function Reveal({ delay = 0, className, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>('static')

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (el.offsetHeight > window.innerHeight) return
    if (el.getBoundingClientRect().top < window.innerHeight) return
    setPhase('armed')
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setPhase('entered')
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
    <div ref={ref} data-reveal="" className={className} style={style} {...rest}>
      <div
        className={cn(
          // Arming hides with no transition: it happens off-screen, and a fade
          // there would still be mid-flight if the reader arrived early.
          phase === 'armed' && 'translate-y-6 opacity-0 transition-none',
          // `translate`, not `transform`: Tailwind v4 compiles `translate-y-*`
          // to the independent `translate` property, which a transition naming
          // `transform` does not reach (see `../motion.ts`). `translate-none`
          // rather than `translate-y-0`: a settled reveal must leave no
          // translation behind, because any value but `none` makes the element
          // a containing block for the fixed and sticky descendants a band may
          // hold.
          phase === 'entered' &&
            'duration-(--duration-reveal) translate-none opacity-100 transition-[opacity,translate] ease-out motion-reduce:transition-none',
        )}
        style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
