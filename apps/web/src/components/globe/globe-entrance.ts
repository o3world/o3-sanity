import { GLOBE_SETTLE_RATE } from './globe-parallax'

/** Move the glow host first so the GPU rails inherit exactly the same entrance. */
export function createGlobeEntrance(globe: HTMLElement, hero: HTMLElement) {
  const saved = globe.style.getPropertyValue('transform')
  const priority = globe.style.getPropertyPriority('transform')
  let start: number | undefined
  let distance = 0
  let finished = false
  const restore = () => {
    if (saved) globe.style.setProperty('transform', saved, priority)
    else globe.style.removeProperty('transform')
  }
  return {
    update(now: number, still: boolean) {
      if (finished) return
      const bounds = hero.getBoundingClientRect()
      if (still || bounds.top < -80) {
        finished = true
        restore()
        return
      }
      if (start === undefined) {
        start = now
        distance = Math.max(96, bounds.bottom - globe.getBoundingClientRect().top)
      }
      const elapsed = Math.max(0, (now - start) / 1000)
      const phase = GLOBE_SETTLE_RATE * elapsed
      // A critically damped rise shares parallax's settling rate without an initial burst.
      const offset = distance * (1 + phase) * Math.exp(-phase)
      if (offset < 0.25) {
        finished = true
        restore()
      } else globe.style.setProperty('transform', `translateY(${offset.toFixed(3)}px)`)
    },
    dispose: restore,
  }
}
