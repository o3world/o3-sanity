'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import './spatial-globe.css'

/** The saved spatial baseline, mounted only in this prototype's development shell. */
export function SpatialGlobePrototype() {
  const path = usePathname()
  useEffect(() => {
    if (path !== '/') return
    const hero = document.querySelector<HTMLElement>('.hero-band')
    const globe = hero?.querySelector<HTMLElement>('.hero-lag > div')
    if (!hero || !globe) return
    const canvas = document.createElement('canvas')
    canvas.className = 'spatial-globe-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    hero.prepend(canvas)
    const abort = new AbortController()
    import('./renderer')
      .then(({ startSpatialGlobe }) => {
        if (!abort.signal.aborted) return startSpatialGlobe(canvas, hero, globe, abort.signal)
      })
      .catch((error) => {
        if (!abort.signal.aborted) console.warn('Spatial prototype kept the original globe:', error)
      })
    return () => {
      abort.abort()
      canvas.remove()
      delete hero.dataset.spatialReady
    }
  }, [path])
  return null
}
