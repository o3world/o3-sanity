/** One scene clock, established before hydration and independent of text cadence. */
export function readGlobeEntranceTiming(hero: HTMLElement, now: number) {
  const start = hero.dataset.sceneStart
  return {
    elapsed: start === undefined ? undefined : Math.max(0, now - Number(start)),
    startDelay: 160,
    duration: 160 + 2047.5,
    returnTail: 750,
  }
}

/** A continuous rise and release in CSS pixels. No renderer or DOM state. */
export function globeEntranceOffset(
  elapsed: number,
  distance: number,
  startDelay: number,
  duration: number,
  returnTail: number,
) {
  const riseDuration = duration - startDelay
  const progress = Math.min(1, Math.max(0, (elapsed - startDelay) / riseDuration))
  const release = Math.max(
    0,
    Math.min(1, (elapsed - startDelay - riseDuration * 0.25) / (riseDuration * 0.75 + returnTail)),
  )
  const overshoot = Math.min(6, distance * 0.03) * 64 * (release * (1 - release)) ** 3
  return distance * (1 - progress) ** 4 * (1 + 4 * progress) - overshoot
}

/** The sky rises throughout the scene, without the globe's overshoot or return. */
export function readSkyEntranceOffset(
  hero: HTMLElement,
  now: number,
  distance: number,
  timingAt = readGlobeEntranceTiming,
) {
  const { elapsed, duration, returnTail } = timingAt(hero, now)
  if (elapsed === undefined) return 0
  const progress = Math.min(1, elapsed / (duration + returnTail))
  return distance * (1 - progress) ** 4 * (1 + 4 * progress)
}

/** Rise after the first scene beat, then drift back from a small overshoot. */
export function createGlobeEntrance(globe: HTMLElement, hero: HTMLElement) {
  const mobile = innerWidth < 1024
  const saved = globe.style.getPropertyValue('transform')
  const priority = globe.style.getPropertyPriority('transform')
  let distance: number | undefined
  let finished = false
  const restore = () => {
    if (saved) globe.style.setProperty('transform', saved, priority)
    else globe.style.removeProperty('transform')
  }
  return {
    update(now: number, still: boolean) {
      if (finished) return 0
      const bounds = hero.getBoundingClientRect()
      const { elapsed, duration, startDelay, returnTail } = readGlobeEntranceTiming(hero, now)
      if (
        still ||
        bounds.top < -80 ||
        !duration ||
        elapsed === undefined ||
        elapsed >= duration + returnTail
      ) {
        finished = true
        restore()
        return 0
      }
      distance ??=
        (mobile ? 48 : Math.max(96, bounds.bottom - globe.getBoundingClientRect().top)) * 1.15
      const offset = globeEntranceOffset(elapsed, distance, startDelay, duration, returnTail)
      globe.style.setProperty('transform', `translateY(${offset.toFixed(3)}px)`)
      return offset
    },
    dispose: restore,
  }
}
