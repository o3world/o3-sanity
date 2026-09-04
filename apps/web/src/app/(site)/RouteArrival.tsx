'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { NAV_INK_TARGET, settleNavInk } from '@o3/content-ui/chrome/nav-ink'
import { syncNavPin } from '@o3/content-ui/chrome/nav-pin'

/** Animate live foregrounds; authored grounds and native navigation stay intact. */
export function RouteArrival() {
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname

    const header = document.getElementById(NAV_INK_TARGET)
    if (header) {
      syncNavPin(header)
      settleNavInk(header)
    }

    const main = document.getElementById('site-content')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (
      !main ||
      typeof main.animate !== 'function' ||
      typeof main.getAnimations !== 'function' ||
      reducedMotion.matches
    )
      return

    const style = getComputedStyle(main)
    const duration = style.getPropertyValue('--duration-page').trim()
    const timing = {
      duration: parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000),
      easing: style.getPropertyValue('--ease-out').trim(),
    }
    const existing = main.getAnimations({ subtree: true })
    const animations = [...main.querySelectorAll<HTMLElement>('[data-route-foreground]')]
      .filter((foreground) => {
        const box = foreground.getBoundingClientRect()
        if (!box.width || !box.height || box.bottom <= 0 || box.top >= innerHeight) return false
        if (foreground.closest('[hidden], [inert], [aria-hidden="true"]')) return false
        // Nested shells opt in at their innermost foreground, never twice.
        if (foreground.querySelector('[data-route-foreground]')) return false
        // An existing entrance/reveal is already the owner of this subtree.
        return !existing.some((animation) => {
          const effect = animation.effect as KeyframeEffect | null
          const target = effect?.target
          return (
            animation.playState === 'running' &&
            target instanceof Element &&
            (foreground.contains(target) || target.contains(foreground)) &&
            effect!.getKeyframes().some((frame) => frame.opacity !== undefined)
          )
        })
      })
      .map((foreground) => foreground.animate([{ opacity: 0.72 }, { opacity: 1 }], timing))
    const cancelForReducedMotion = () => {
      if (reducedMotion.matches) animations.forEach((animation) => animation.cancel())
    }
    reducedMotion.addEventListener('change', cancelForReducedMotion)
    return () => {
      animations.forEach((animation) => animation.cancel())
      reducedMotion.removeEventListener('change', cancelForReducedMotion)
    }
  }, [pathname])

  return null
}
