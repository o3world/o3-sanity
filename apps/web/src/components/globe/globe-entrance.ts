import { heroStagger } from '@o3/ui'

/** The globe catches up to the hero text clock when the GPU becomes ready. */
export function readGlobeEntranceTiming(hero: HTMLElement, now: number, stagger = heroStagger) {
  const items = [...hero.querySelectorAll('.hero-lead h1 > span, .hero-lead > div')]
  const animation = items
    .at(-1)
    ?.getAnimations?.()
    .find((animation) =>
      (animation.effect as KeyframeEffect | null)
        ?.getKeyframes()
        .some((frame) => frame.opacity !== undefined),
    )
  const timing = animation?.effect?.getTiming()
  const beat = stagger(items.length)
  const delay = Math.max(0, items.length - 1) * beat
  const startDelay =
    (hero.querySelectorAll('.hero-lead h1 > span').length > 1 ? beat : 0) + beat / 2
  const riseDuration =
    typeof timing?.duration === 'number'
      ? (delay + timing.duration + beat * 2 - startDelay) * 1.3
      : 0
  const duration = riseDuration ? startDelay + riseDuration : 0
  const elapsed =
    typeof animation?.startTime === 'number'
      ? now - animation.startTime
      : typeof animation?.currentTime === 'number'
        ? animation.currentTime
        : undefined
  return { elapsed, duration, startDelay }
}

/** A continuous rise and release in CSS pixels. No renderer or DOM state. */
export function globeEntranceOffset(
  elapsed: number,
  distance: number,
  startDelay: number,
  duration: number,
) {
  const riseDuration = duration - startDelay
  const progress = Math.min(1, Math.max(0, (elapsed - startDelay) / riseDuration))
  const release = Math.max(
    0,
    Math.min(1, (elapsed - startDelay - riseDuration * 0.25) / (riseDuration * 0.75 + 600)),
  )
  const overshoot = Math.min(6, distance * 0.03) * 64 * (release * (1 - release)) ** 3
  return distance * (1 - progress) ** 4 * (1 + 4 * progress) - overshoot
}

/** The startup canvas and GPU sky follow the nav's earlier entrance clock. */
export function readSkyEntranceOffset(
  hero: HTMLElement,
  now: number,
  distance: number,
  offsetAt = globeEntranceOffset,
) {
  const animation = hero.ownerDocument
    .getElementById('site-nav')
    ?.getAnimations()
    .find((animation) => (animation as CSSAnimation).animationName === 'hero-wave')
  const duration = animation?.effect?.getTiming().duration
  if (!animation || typeof duration !== 'number') return 0
  const elapsed =
    typeof animation.startTime === 'number'
      ? now - animation.startTime
      : typeof animation.currentTime === 'number'
        ? animation.currentTime
        : 0
  // The sky settles once; the globe alone keeps its overshoot and return.
  return Math.max(0, offsetAt(elapsed, distance, 0, duration - 600))
}

/** Rise just after the second headline line, then drift back from a small overshoot. */
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
      const { elapsed, duration, startDelay } = readGlobeEntranceTiming(hero, now)
      const returnTail = 600
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
      const offset = globeEntranceOffset(elapsed, distance, startDelay, duration)
      globe.style.setProperty('transform', `translateY(${offset.toFixed(3)}px)`)
      return offset
    },
    dispose: restore,
  }
}
