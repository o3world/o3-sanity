'use client'

import { createContext, useEffect, useState, type RefObject } from 'react'
import { useSpatialMotion } from '../globe/SpatialMotionProvider'
import { sampleCardScroll, type ScrollSample } from './work-card-motion'

export type WorkCardFrame = {
  dt: number
  scrollVelocity: number
  reset: boolean
  atRest: boolean
}
type Listener = (frame: WorkCardFrame) => void
export const WorkCardFrames = createContext<Set<Listener> | null>(null)

/** One input sample and clock for the section; each card retains its own spring. */
export function useWorkCardFrames(rootRef: RefObject<HTMLDivElement | null>) {
  const [listeners] = useState(() => new Set<Listener>())
  const motion = useSpatialMotion()
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let raf = 0
    let active = false
    let previous: ScrollSample | undefined
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const paused = () => document.hidden || reduced.matches || !!motion?.getSnapshot()
    const publish = (frame: WorkCardFrame) => listeners.forEach((listener) => listener(frame))
    const paint = (now: number) => {
      raf = 0
      if (!active || paused()) return
      const result = sampleCardScroll(previous, now, window.scrollY)
      previous = result.sample
      publish({
        dt: result.dt,
        scrollVelocity: result.sample.velocity,
        reset: result.reset,
        atRest: false,
      })
      raf = requestAnimationFrame(paint)
    }
    const refresh = () => {
      cancelAnimationFrame(raf)
      raf = 0
      previous = undefined
      publish({ dt: 0, scrollVelocity: 0, reset: true, atRest: !active })
      if (active && !paused()) raf = requestAnimationFrame(paint)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry?.isIntersecting ?? false
        refresh()
      },
      { rootMargin: '240px 0px' },
    )
    observer.observe(root)
    const resize = new ResizeObserver(refresh)
    resize.observe(root)
    const unsubscribe = motion?.subscribe(refresh)
    window.addEventListener('resize', refresh, { passive: true })
    window.addEventListener('pageshow', refresh)
    window.addEventListener('popstate', refresh)
    document.addEventListener('visibilitychange', refresh)
    reduced.addEventListener('change', refresh)
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      resize.disconnect()
      unsubscribe?.()
      window.removeEventListener('resize', refresh)
      window.removeEventListener('pageshow', refresh)
      window.removeEventListener('popstate', refresh)
      document.removeEventListener('visibilitychange', refresh)
      reduced.removeEventListener('change', refresh)
    }
  }, [listeners, motion, rootRef])
  return listeners
}
