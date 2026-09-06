import type { heroStagger } from '@o3/ui'
import type { globeEntranceOffset, readGlobeEntranceTiming } from './globe-entrance'
import type { createStartupSky } from './startup-sky'
import type { starHash } from './star-seed'

/** Runs from server HTML, before hydration. All dependencies are supplied explicitly. */
export function startStartupSky(
  createSky: typeof createStartupSky,
  hash: typeof starHash,
  readTiming: typeof readGlobeEntranceTiming,
  offsetAt: typeof globeEntranceOffset,
  stagger: typeof heroStagger,
) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)')
  const still = new URLSearchParams(location.search).has('spatial-still')
  if (location.pathname === '/') {
    document.documentElement.dataset.spatialChrome = 'true'
    if (!reduced.matches && !still) document.documentElement.dataset.heroStartup = 'pending'
  }
  const releaseStartup = () => {
    delete document.documentElement.dataset.heroStartup
    if (!document.querySelector('.hero-band[data-spatial-ready]'))
      delete document.documentElement.dataset.spatialChrome
  }
  // Match the renderer's failure deadline so an unavailable GPU cannot trap the copy.
  const deadline = setTimeout(() => {
    observer.disconnect()
    releaseStartup()
  }, 10000)
  const observer = new MutationObserver(start)
  function start() {
    const hero = document.querySelector<HTMLElement>('.hero-band:has(.hero-lead)')
    const globe = hero?.querySelector<HTMLElement>('.hero-lag > [data-orbital-preset]')
    const canvas = globe?.querySelector<HTMLCanvasElement>('[data-orbital-startup]')
    if (!hero || !globe || !canvas) return
    observer.disconnect()
    const context = canvas.getContext('2d')
    if (!context) {
      clearTimeout(deadline)
      releaseStartup()
      return
    }
    const project = createSky(hash)
    const initialBounds = hero.getBoundingClientRect()
    const entrance = location.pathname === '/' && initialBounds.top >= -80
    const distance =
      (innerWidth < 1024
        ? 48
        : Math.max(96, initialBounds.bottom - globe.getBoundingClientRect().top)) * 1.15
    let readyAt: number | undefined
    let firstFrame: number | undefined
    let raf = 0
    let stopped = false
    let lastPaint = ''
    const stop = () => {
      if (stopped) return
      stopped = true
      clearTimeout(deadline)
      releaseStartup()
      cancelAnimationFrame(raf)
      delete canvas.dataset.painted
      canvas.width = 0
      canvas.height = 0
      window.removeEventListener('pagehide', stop)
    }
    const paint = (now: number) => {
      if (!hero.isConnected || !globe.isConnected || !canvas.isConnected) return stop()
      if (!globe.hasAttribute('data-orbital-loading') && !globe.hasAttribute('data-orbital-gpu'))
        return stop()
      firstFrame ??= now
      if (hero.hasAttribute('data-spatial-ready')) {
        readyAt ??= now
        clearTimeout(deadline)
        releaseStartup()
      }
      // Continue through the GPU's opacity transition, then release the temporary buffer.
      if (readyAt !== undefined && now - readyAt >= (reduced.matches ? 0 : 220)) return stop()
      const bounds = hero.getBoundingClientRect()
      const g = globe.getBoundingClientRect()
      if (!bounds.width || bounds.bottom <= 0 || bounds.top >= innerHeight) return stop()
      const overhang = Math.max(0, bounds.top + scrollY)
      const width = bounds.width
      const height = bounds.height + overhang
      const dpr = Math.min(devicePixelRatio || 1, 2)
      const w = Math.round(width * dpr)
      const h = Math.round(height * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      canvas.style.left = `${bounds.left - g.left}px`
      canvas.style.top = `${bounds.top - overhang - g.top}px`
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      const timing = readTiming(hero, now, stagger)
      const elapsed = timing.elapsed ?? now - firstFrame
      const offset =
        entrance && !reduced.matches && !still && timing.duration
          ? offsetAt(elapsed, distance, timing.startDelay, timing.duration)
          : 0
      const cameraY = -offset / (g.width / 680)
      const frame = `${w},${h},${cameraY}`
      if (frame !== lastPaint) {
        lastPaint = frame
        context.setTransform(dpr, 0, 0, dpr, 0, 0)
        context.clearRect(0, 0, width, height)
        for (const point of project(width, height, cameraY)) {
          context.globalAlpha = point.opacity
          context.fillStyle = point.color
          context.beginPath()
          context.arc(point.x, point.y, point.radius, 0, Math.PI * 2)
          context.fill()
        }
        canvas.dataset.painted = 'true'
      }
      // A failed/disabled GPU leaves the server sky as the permanent fallback.
      if (now - firstFrame >= 10000) return stop()
      raf = requestAnimationFrame(paint)
    }
    window.addEventListener('pagehide', stop, { once: true })
    paint(performance.now())
  }
  observer.observe(document.documentElement, { childList: true, subtree: true })
  start()
}
