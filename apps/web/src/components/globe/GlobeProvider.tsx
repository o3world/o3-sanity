'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { OrbitalRendererContext } from '@o3/ui'
import type { OrbitalRendererProps } from '@o3/ui'
import './globe.css'

function GlobeRenderer({ hostRef, arcs, preset, motion, opacity, onReady }: OrbitalRendererProps) {
  const [placement, setPlacement] = useState<{ target: HTMLElement; stars: boolean } | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const hero = host.closest<HTMLElement>('.hero-band')
    const stars = location.pathname === '/' && !!hero?.querySelector('.hero-lead')
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setPlacement({ target: stars ? hero! : host, stars })
          observer.disconnect()
        }
      },
      { rootMargin: '100px' },
    )
    observer.observe(stars ? hero! : (host.closest('section') ?? host))
    return () => observer.disconnect()
  }, [hostRef])
  useEffect(() => {
    const host = hostRef.current
    if (!canvas || !placement || !host) return
    const controller = new AbortController()
    import('./renderer')
      .then(({ startSpatialGlobe }) => {
        if (!controller.signal.aborted)
          return startSpatialGlobe(canvas, placement.target, host, controller.signal, {
            arcs,
            preset,
            motion,
            opacity,
            onReady,
            stars: placement.stars,
          })
      })
      .catch(() => {
        if (!controller.signal.aborted) onReady(false)
      })
    return () => controller.abort()
  }, [canvas, placement, hostRef, arcs, preset, motion, opacity, onReady])
  return placement
    ? createPortal(
        <canvas
          ref={setCanvas}
          aria-hidden="true"
          className={placement.stars ? 'spatial-globe-canvas' : 'orbital-globe-canvas'}
        />,
        placement.target,
      )
    : null
}

export function GlobeProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  return (
    <OrbitalRendererContext.Provider value={enabled ? GlobeRenderer : null}>
      {children}
    </OrbitalRendererContext.Provider>
  )
}
