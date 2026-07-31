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
 */
export function Reveal({ delay = 0, className, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
      className={cn(
        'ease-out transition-[opacity,transform] duration-(--duration-reveal)',
        'motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms`, ...style } : style}
      {...rest}
    >
      {children}
    </div>
  )
}
