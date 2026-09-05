'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import './spatial-globe.css'

const modes = [
  ['depth', 'Spatial stars'],
  ['distant', 'Distant stars'],
  ['globe', 'Globe only'],
  ['original', 'Original SVG'],
] as const

/** Throwaway hero study: does the unchanged orbital artwork gain presence in a star field? */
export function SpatialGlobePrototype() {
  const search = useSearchParams()
  const router = useRouter()
  const path = usePathname()
  const dotStyle = search.get('dots') === 'sphere' ? 'sphere' : 'glow'
  const requested = search.get('spatial')
  const mode = modes.some(([key]) => key === requested) ? requested : null
  const [status, setStatus] = useState('Loading scene…')
  useEffect(() => {
    if (!mode || path !== '/') return
    const hero = document.querySelector<HTMLElement>('.hero-band')
    const globe = hero?.querySelector<HTMLElement>('.hero-lag > div')
    if (!hero || !globe || mode === 'original') return
    const canvas = document.createElement('canvas')
    canvas.className = 'spatial-globe-canvas'
    canvas.setAttribute('aria-hidden', 'true')
    hero.prepend(canvas)
    const abort = new AbortController()
    import('./renderer')
      .then(({ startSpatialGlobe }) => {
        if (!abort.signal.aborted)
          return startSpatialGlobe(canvas, hero, globe, mode, dotStyle, abort.signal, setStatus)
      })
      .catch((error) => {
        if (!abort.signal.aborted) setStatus(`Original globe · ${String(error)}`)
      })
    return () => {
      abort.abort()
      canvas.remove()
      delete hero.dataset.spatialReady
    }
  }, [mode, path, dotStyle])
  const switchTo = (next: string) => {
    setStatus('Loading scene…')
    const query = new URLSearchParams(search.toString())
    query.set('spatial', next)
    router.replace(`${path}?${query}`, { scroll: false })
  }
  if (!mode || path !== '/') return null
  return (
    <aside className="spatial-review" aria-label="Spatial globe prototype controls">
      <span className="spatial-review-title">Spatial study</span>
      <div className="spatial-review-options">
        {modes.map(([key, label]) => (
          <button key={key} aria-pressed={mode === key} onClick={() => switchTo(key)}>
            {label}
          </button>
        ))}
      </div>
      {mode !== 'original' && (
        <button
          onClick={() => {
            setStatus('Loading scene…')
            const query = new URLSearchParams(search.toString())
            query.set('dots', dotStyle === 'sphere' ? 'glow' : 'sphere')
            router.replace(`${path}?${query}`, { scroll: false })
          }}
        >
          Dots: {dotStyle === 'sphere' ? 'Shaded' : 'Glow'}
        </button>
      )}
      <span className="spatial-review-status" role="status">
        {mode === 'original' ? 'Existing renderer' : status}
      </span>
    </aside>
  )
}
