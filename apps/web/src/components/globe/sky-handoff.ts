/** Keep the GPU sky on the still image's pose until its crossfade finishes. */
export function createSkyHandoff() {
  let motionStart: number | undefined
  let elapsed = 0
  return {
    reveal(now: number, fadeDuration: number) {
      motionStart = now + fadeDuration
    },
    sample(now: number, dt: number, still: boolean) {
      const progress =
        still || motionStart === undefined ? 0 : Math.max(0, Math.min(1, (now - motionStart) / 600))
      const mix = progress * progress * (3 - 2 * progress)
      const step = Math.min(dt, 1 / 20) * mix
      elapsed += step
      return { elapsed: still ? 0 : elapsed, step, mix }
    },
  }
}
