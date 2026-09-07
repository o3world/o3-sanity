'use client'

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { frame, surface } from 'vgpu'
import { useGlobeRuntime } from '../globe/GlobeProvider'
import { useSpatialMotion } from '../globe/SpatialMotionProvider'
import { subscribeWorkStudy, readWorkStudy, noWorkStudy } from './WorkMembranePrototype'

const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}

/** The existing sky's depth-aware entrance travel, scrubbed along Y through the work section. */
export function WorkStarfieldPrototype({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribeWorkStudy, readWorkStudy, noWorkStudy)
  const enabled = mode === 'on'
  const runtime = useGlobeRuntime()
  const motion = useSpatialMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!enabled || !root || !canvas || !runtime) return
    let disposed = false
    let stop: (() => void) | undefined
    void runtime
      .acquire()
      .then((lease) => {
        if (disposed) return lease.release()
        const target = surface(lease.gpu, canvas, { dpr: [1, 2], alphaMode: 'premultiplied' })
        const stars = lease.draw('stars')
        let raf = 0
        let visible = false
        let last = 0
        let time = 0
        let cameraY = 0
        let failed = false
        const reduced = matchMedia('(prefers-reduced-motion: reduce)')
        const paused = () => motion?.getSnapshot() || reduced.matches
        const paint = (now: number) => {
          raf = 0
          if (disposed || failed) return
          const dt = last ? Math.min(50, now - last) / 1000 : 1 / 60
          last = now
          const bounds = root.getBoundingClientRect()
          const viewportHeight = document.documentElement.clientHeight
          const entry = smooth((viewportHeight - bounds.top) / (viewportHeight * 0.85))
          const exit = smooth(bounds.bottom / (viewportHeight * 0.85))
          canvas.style.opacity = String(entry * exit * 0.65)
          if (!paused()) {
            time += dt
            // Positive camera Y makes stars rise as the page scrolls down, retaining scene depth.
            const destination = (viewportHeight - bounds.top) * 0.8
            cameraY += (destination - cameraY) * (1 - Math.exp(-dt * 5))
          }
          const { width, height } = canvas.getBoundingClientRect()
          stars.set({
            p: {
              viewport: [width, height, 0, 0],
              camera: [0, cameraY, 0, 0],
              motion: [time, 0, 0, 0],
              globe: [0, 0, 0, 0],
              rotation: [0, 0, 0, 1],
            },
          })
          void frame(lease.gpu, (f) => {
            f.pass({ target, clear: [0, 0, 0, 0] }, (pass) => pass.draw(stars))
          }).done.catch(() => {
            failed = true
            cancelAnimationFrame(raf)
          })
          if (visible && !document.hidden && !paused()) raf = requestAnimationFrame(paint)
        }
        const refresh = () => {
          cancelAnimationFrame(raf)
          last = 0
          if (visible && !document.hidden && !failed) raf = requestAnimationFrame(paint)
        }
        const onScroll = () => {
          if (!raf && visible) refresh()
        }
        const observer = new IntersectionObserver(([entry]) => {
          visible = entry?.isIntersecting ?? false
          refresh()
        })
        observer.observe(root)
        const resize = new ResizeObserver(refresh)
        resize.observe(canvas)
        const unsubscribe = motion?.subscribe(refresh)
        lease.onError(() => {
          failed = true
          cancelAnimationFrame(raf)
        })
        window.addEventListener('scroll', onScroll, { passive: true })
        document.addEventListener('visibilitychange', refresh)
        reduced.addEventListener('change', refresh)
        stop = () => {
          cancelAnimationFrame(raf)
          observer.disconnect()
          resize.disconnect()
          unsubscribe?.()
          window.removeEventListener('scroll', onScroll)
          document.removeEventListener('visibilitychange', refresh)
          reduced.removeEventListener('change', refresh)
          target.dispose()
          lease.release()
        }
      })
      .catch(() => {})
    return () => {
      disposed = true
      stop?.()
    }
  }, [enabled, runtime, motion])

  return (
    <div className="work-sky-study" ref={rootRef}>
      <div className="work-sky-study-layer" aria-hidden="true">
        <canvas ref={canvasRef} />
      </div>
      {children}
    </div>
  )
}
