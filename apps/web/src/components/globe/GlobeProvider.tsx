'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { OrbitalRendererContext } from '@o3/ui'
import type { OrbitalRendererProps } from '@o3/ui'
import './globe.css'
import { observeGlobeAvailability } from './observe-globe-availability'

function GlobeRenderer({
  hostRef,
  arcs,
  preset,
  motion,
  opacity,
  electronOpacity,
  onReady,
}: OrbitalRendererProps) {
  const [placement, setPlacement] = useState<{
    target: HTMLElement
    stars: boolean
    quietStars: boolean
    interiorStars: boolean
  } | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const hero = host.closest<HTMLElement>('.hero-band, [data-collection-hero="interior"]')
    const heroStars = location.pathname === '/' && !!hero?.querySelector('.hero-lead')
    const cta = host.closest<HTMLElement>('.cta-band')
    const interiorStars = !!hero && !heroStars && preset === 'hero'
    const quietStars = !!cta || interiorStars
    const stars = heroStars || quietStars
    const target = heroStars || interiorStars ? hero! : (cta ?? host)
    return observeGlobeAvailability(
      host,
      stars ? target : (host.closest('section') ?? host),
      (available) => setPlacement(available ? { target, stars, quietStars, interiorStars } : null),
    )
  }, [hostRef, preset])
  useEffect(() => {
    const host = hostRef.current
    if (!canvas || !placement || !host) return
    const controller = new AbortController()
    onReady(undefined)
    const timeout = setTimeout(() => {
      onReady(false)
      controller.abort()
    }, 10000)
    const reportReady: OrbitalRendererProps['onReady'] = (ready) => {
      if (controller.signal.aborted) return
      if (ready !== undefined) clearTimeout(timeout)
      onReady(ready)
    }
    import('./renderer')
      .then(({ startSpatialGlobe }) => {
        if (!controller.signal.aborted)
          return startSpatialGlobe(canvas, placement.target, host, controller.signal, {
            arcs,
            preset,
            motion,
            opacity,
            electronOpacity,
            onReady: reportReady,
            stars: placement.stars,
            quietStars: placement.quietStars,
          })
      })
      .catch(() => {
        reportReady(false)
      })
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [canvas, placement, hostRef, arcs, preset, motion, opacity, electronOpacity, onReady])
  return placement
    ? createPortal(
        <canvas
          ref={setCanvas}
          aria-hidden="true"
          className={
            placement.interiorStars
              ? 'interior-starfield-canvas'
              : placement.quietStars
                ? 'cta-starfield-canvas'
                : placement.stars
                  ? 'spatial-globe-canvas'
                  : 'orbital-globe-canvas'
          }
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
