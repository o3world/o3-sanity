'use client'

import { useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/** Animate the live destination, never a snapshot that can capture its input. */
export function RouteArrival() {
  const pathname = usePathname()
  const previousPathname = useRef(pathname)

  useLayoutEffect(() => {
    if (previousPathname.current === pathname) return
    previousPathname.current = pathname

    const main = document.getElementById('site-content')
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!main || typeof main.animate !== 'function' || reducedMotion.matches) return

    const style = getComputedStyle(main)
    const duration = style.getPropertyValue('--duration-page').trim()
    const animation = main.animate([{ opacity: 0.72 }, { opacity: 1 }], {
      duration: parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000),
      easing: style.getPropertyValue('--ease-out').trim(),
    })
    const cancelForReducedMotion = () => {
      if (reducedMotion.matches) animation.cancel()
    }
    reducedMotion.addEventListener('change', cancelForReducedMotion)
    return () => {
      animation.cancel()
      reducedMotion.removeEventListener('change', cancelForReducedMotion)
    }
  }, [pathname])

  return null
}
