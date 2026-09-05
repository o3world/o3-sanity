'use client'

import { useEffect, useRef, type HTMLAttributes } from 'react'

/**
 * One viewport boundary for semantic children marked with data-reveal-step.
 * Their DOM order owns cadence. Nested sequences own their own boundary, so
 * details below long prose do not finish entering before the reader reaches them.
 */
export function RevealSequence({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    const preference = matchMedia('(prefers-reduced-motion: reduce)')
    if (!root || preference.matches || document.hidden || !('IntersectionObserver' in window))
      return
    if (!root.getClientRects().length || root.getBoundingClientRect().top < innerHeight) return
    const items = [...root.querySelectorAll<HTMLElement>('[data-reveal-step]')].filter(
      (item) => item.closest('[data-reveal-sequence]') === root,
    )
    if (!items.length) return
    let frame = 0
    let previousScroll = scrollY
    let entered = false
    let finished = false
    const pending = new Set(items)

    function finish() {
      if (finished) return
      finished = true
      observer.disconnect()
      cancelAnimationFrame(frame)
      removeEventListener('scroll', scroll)
      removeEventListener('resize', finish)
      removeEventListener('pagehide', finish)
      document.removeEventListener('visibilitychange', visibility)
      preference.removeEventListener('change', motion)
      root!.removeEventListener('focusin', finish)
      root!.removeEventListener('animationend', end)
      for (const item of items) {
        delete item.dataset.sequencePhase
        item.style.removeProperty('--sequence-order')
      }
    }
    function inspect() {
      frame = 0
      const bounds = root!.getBoundingClientRect()
      const jump = Math.abs(scrollY - previousScroll)
      previousScroll = scrollY
      if (
        !root!.getClientRects().length ||
        bounds.bottom <= 0 ||
        (bounds.top < innerHeight && jump > innerHeight / 2) ||
        (entered && bounds.top >= innerHeight)
      )
        finish()
    }
    function scroll() {
      if (!frame) frame = requestAnimationFrame(inspect)
    }
    function visibility() {
      if (document.hidden) finish()
    }
    function motion() {
      if (preference.matches) finish()
    }
    function end(event: AnimationEvent) {
      if (event.animationName !== 'sequence-enter') return
      const item = event.target as HTMLElement
      if (!pending.delete(item)) return
      delete item.dataset.sequencePhase
      item.style.removeProperty('--sequence-order')
      if (!pending.size) finish()
    }

    items.forEach((item, index) => {
      item.dataset.sequencePhase = 'armed'
      item.style.setProperty('--sequence-order', String(Math.min(index, 2)))
    })
    const observer = new IntersectionObserver(
      (entries) => {
        if (finished || !entries.some((entry) => entry.isIntersecting)) return
        entered = true
        for (const item of items) item.dataset.sequencePhase = 'entered'
        observer.disconnect()
      },
      // Leave room to see the heading and the start of its supporting paragraph.
      { rootMargin: `0px 0px -${Math.round(innerHeight * 0.35)}px 0px`, threshold: 0 },
    )
    observer.observe(root)
    addEventListener('scroll', scroll, { passive: true })
    addEventListener('resize', finish)
    addEventListener('pagehide', finish)
    document.addEventListener('visibilitychange', visibility)
    preference.addEventListener('change', motion)
    root.addEventListener('focusin', finish)
    root.addEventListener('animationend', end)
    return finish
  }, [])

  return (
    <div ref={ref} data-reveal-sequence="" {...props}>
      {children}
    </div>
  )
}
