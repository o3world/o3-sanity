/** Phone tilt feeds the same easing as cursor steering.
 * No permission requests, controls, or persistence. ?tilt=off compares ambient motion.
 */
export function startPhoneTilt(
  canvas: HTMLCanvasElement,
  active: () => boolean,
  steer: (x: number, y: number, reset?: boolean) => void,
) {
  const coarse = matchMedia('(pointer: coarse)')
  if (!window.isSecureContext || !coarse.matches || !('DeviceOrientationEvent' in window)) {
    canvas.dataset.phoneTilt = 'unavailable'
    return () => {
      delete canvas.dataset.phoneTilt
    }
  }
  canvas.dataset.phoneTilt = 'listening'
  let neutral: { beta: number; gamma: number; angle: number } | undefined
  const relative = (value: number, origin: number) => ((value - origin + 540) % 360) - 180
  const normalize = (degrees: number) =>
    Math.sign(degrees) * Math.min(1, Math.max(0, Math.abs(degrees) - 1.25) / 18) * 1.1
  const orientation = (event: DeviceOrientationEvent) => {
    if (!active() || !coarse.matches) {
      neutral = undefined
      canvas.dataset.phoneTilt = 'paused'
      return
    }
    const { beta, gamma } = event
    if (beta === null || gamma === null || !Number.isFinite(beta) || !Number.isFinite(gamma)) return
    const angle = screen.orientation?.angle ?? 0
    if (!neutral || neutral.angle !== angle) {
      neutral = { beta, gamma, angle }
      steer(0, 0, true)
    }
    const radians = (angle * Math.PI) / 180
    const dx = relative(gamma, neutral.gamma)
    const dy = relative(beta, neutral.beta)
    steer(
      normalize(dx * Math.cos(radians) + dy * Math.sin(radians)),
      normalize(dy * Math.cos(radians) - dx * Math.sin(radians)),
    )
    canvas.dataset.phoneTilt = 'active'
  }
  const reset = () => {
    neutral = undefined
  }
  window.addEventListener('deviceorientation', orientation, { passive: true })
  document.addEventListener('visibilitychange', reset)
  return () => {
    window.removeEventListener('deviceorientation', orientation)
    document.removeEventListener('visibilitychange', reset)
    delete canvas.dataset.phoneTilt
  }
}
