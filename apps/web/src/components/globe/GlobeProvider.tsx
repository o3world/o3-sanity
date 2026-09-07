'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { OrbitalRendererContext } from '@o3/ui'
import type { OrbitalRendererProps } from '@o3/ui'
import './globe.css'
import { observeGlobeAvailability } from './observe-globe-availability'
import type { GlobeRuntime } from './globe-runtime'
import { SpatialMotionProvider, useSpatialMotion } from './SpatialMotionProvider'

type Engine = {
  runtime: GlobeRuntime
  homeEntranceAvailable: boolean
  start: typeof import('./renderer').startSpatialGlobe
}
const GlobeRuntimeContext = createContext<Engine | null>(null)
const GlobeFailureContext = createContext(false)

export function GlobeRenderer({
  hostRef,
  arcs,
  preset,
  motion,
  opacity,
  electronOpacity,
  onReady,
}: OrbitalRendererProps) {
  const engine = useContext(GlobeRuntimeContext)
  const failed = useContext(GlobeFailureContext)
  const spatialMotion = useSpatialMotion()
  const [placement, setPlacement] = useState<{
    target: HTMLElement
    stars: boolean
    quietStars: boolean
    interiorStars: boolean
  } | null>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  useEffect(() => {
    if (failed) onReady(false)
  }, [failed, onReady])
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
    const availablePlacement = { target, stars, quietStars, interiorStars }
    return observeGlobeAvailability(
      host,
      stars ? target : (host.closest('section') ?? host),
      (available) => setPlacement(available ? availablePlacement : null),
    )
  }, [hostRef, preset])
  useLayoutEffect(() => {
    const host = hostRef.current
    if (!canvas || !placement || !host || !engine || failed) return
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
    const entrance = placement.stars && !placement.quietStars && engine.homeEntranceAvailable
    if (entrance) engine.homeEntranceAvailable = false
    engine
      .start(canvas, placement.target, host, controller.signal, engine.runtime, {
        arcs,
        entrance,
        preset,
        motion,
        opacity,
        electronOpacity,
        onReady: reportReady,
        stars: placement.stars,
        quietStars: placement.quietStars,
        spatialMotion,
      })
      .catch(() => {
        reportReady(false)
      })
    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [
    canvas,
    placement,
    hostRef,
    arcs,
    preset,
    motion,
    opacity,
    electronOpacity,
    onReady,
    engine,
    failed,
    spatialMotion,
  ])
  return (
    <>
      {preset === 'hero' && (
        <canvas
          data-orbital-startup=""
          width={0}
          height={0}
          suppressHydrationWarning
          aria-hidden="true"
        />
      )}
      {placement
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
        : null}
    </>
  )
}

function EnabledGlobeProvider({ children }: { children: ReactNode }) {
  const [engine, setEngine] = useState<Engine | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let disposed = false
    const homeEntranceAvailable = location.pathname === '/'
    let runtime: GlobeRuntime | undefined
    const timeout = setTimeout(() => {
      disposed = true
      setFailed(true)
    }, 10000)
    void Promise.all([import('./globe-runtime'), import('./renderer')])
      .then(([{ createGlobeRuntime }, { startSpatialGlobe }]) => {
        if (disposed) return
        clearTimeout(timeout)
        runtime = createGlobeRuntime()
        void runtime.warm().catch(() => {})
        setEngine({ runtime, start: startSpatialGlobe, homeEntranceAvailable })
      })
      .catch(() => {
        clearTimeout(timeout)
        if (!disposed) setFailed(true)
      })
    return () => {
      clearTimeout(timeout)
      disposed = true
      runtime?.dispose()
    }
  }, [])
  return (
    <SpatialMotionProvider>
      <GlobeRuntimeContext.Provider value={engine}>
        <GlobeFailureContext.Provider value={failed}>
          <OrbitalRendererContext.Provider value={GlobeRenderer}>
            {children}
          </OrbitalRendererContext.Provider>
        </GlobeFailureContext.Provider>
      </GlobeRuntimeContext.Provider>
    </SpatialMotionProvider>
  )
}

export function GlobeProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  return enabled ? <EnabledGlobeProvider>{children}</EnabledGlobeProvider> : children
}
