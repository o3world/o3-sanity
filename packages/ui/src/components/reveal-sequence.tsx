'use client'

import { useEffect, useRef, type HTMLAttributes } from 'react'

/**
 * One viewport boundary for semantic children marked with data-reveal-step.
 * Their DOM order owns cadence. Nested sequences own their own boundary, so
 * details below long prose do not finish entering before the reader reaches them.
 */
export function RevealSequence({
  children,
  cadence = 'content',
  boundaries = 'group',
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  cadence?: 'content' | 'foreground'
  boundaries?: 'group' | 'items'
}) {
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
    const boundaryOf = (item: HTMLElement) =>
      boundaries === 'items' ? (item.closest('[data-reveal-boundary]') ?? item) : root
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
      item.style.setProperty(
        '--sequence-order',
        String(Math.min(index + (cadence === 'foreground' ? 1 : 0), 2)),
      )
    })
    const observer = new IntersectionObserver(
      (entries) => {
        if (finished || !entries.some((entry) => entry.isIntersecting)) return
        entered = true
        const reached = new Set(
          entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target),
        )
        // A tall grid shares an observer, but only the row in view gets a cadence.
        items
          .filter((item) => reached.has(boundaryOf(item)))
          .forEach((item, index) => {
            item.style.setProperty(
              '--sequence-order',
              String(Math.min(index + (cadence === 'foreground' ? 1 : 0), 2)),
            )
            item.dataset.sequencePhase = 'entered'
          })
        for (const boundary of reached) observer.unobserve(boundary)
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0 },
    )
    for (const boundary of new Set(items.map(boundaryOf))) observer.observe(boundary)
    addEventListener('scroll', scroll, { passive: true })
    addEventListener('resize', finish)
    addEventListener('pagehide', finish)
    document.addEventListener('visibilitychange', visibility)
    preference.addEventListener('change', motion)
    root.addEventListener('focusin', finish)
    root.addEventListener('animationend', end)
    return finish
  }, [cadence, boundaries])

  return (
    <div ref={ref} data-reveal-sequence="" {...props}>
      {children}
    </div>
  )
}
