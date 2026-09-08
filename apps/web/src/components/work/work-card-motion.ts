export type CardSpring = { position: number; velocity: number }
export type CardProfile = {
  limit: number
  gain: number
  response: number
  phase: number
  pace: number
}

const profiles: Record<string, CardProfile> = {
  'case-studies-ironman-digital-experience-drupal-acquia': {
    limit: 28,
    gain: 0.07,
    response: 0.14,
    phase: 0,
    pace: 0.85,
  },
  vertex: { limit: 20, gain: 0.045, response: 0.105, phase: 1.7, pace: 1 },
  caron: { limit: 34, gain: 0.09, response: 0.18, phase: 3.4, pace: 1.15 },
}

export function cardProfile(href: string): CardProfile {
  const slug = href.split(/[?#]/)[0]?.replace(/\/$/, '').split('/').pop() ?? ''
  return profiles[slug] ?? { limit: 28, gain: 0.07, response: 0.14, phase: 0, pace: 1 }
}

/** Each neighbor reserves its own half of the gap after edge and ambient motion. */
export function cardTravelScale(profile: CardProfile, mobile: boolean, gap: number) {
  return Math.max(0, Math.min(mobile ? 0.6 : 1, (gap - 19 - 24) / (2 * profile.limit)))
}

/** Exact critically damped step for this frame's constant target. */
export function stepCardSpring(
  state: CardSpring,
  target: number,
  response: number,
  dt: number,
): CardSpring {
  const omega = 1 / response
  const error = state.position - target
  const b = state.velocity + omega * error
  const decay = Math.exp(-omega * dt)
  return {
    position: target + (error + b * dt) * decay,
    velocity: (state.velocity - omega * b * dt) * decay,
  }
}

export function cardDragTarget(profile: CardProfile, scrollVelocity: number, scale: number) {
  const speed = (profile.gain * scrollVelocity) / profile.limit
  return (-scale * profile.limit * speed) / Math.sqrt(1 + speed * speed)
}

export type CardScrollState = CardSpring & { momentum: number }

export function stepScrollCard(
  state: CardScrollState,
  profile: CardProfile,
  scrollVelocity: number,
  scale: number,
  dt: number,
): CardScrollState {
  if (dt <= 0) return state
  const speed = Math.abs(scrollVelocity)
  const memory = speed > state.momentum ? 0.06 : 0.35
  const momentum = state.momentum + (speed - state.momentum) * (1 - Math.exp(-dt / memory))
  const release = Math.max(0, momentum - speed) / (600 + momentum)
  const spring = stepCardSpring(
    state,
    cardDragTarget(profile, scrollVelocity, scale),
    profile.response * (1 + release * 1.2),
    dt,
  )
  const limit = profile.limit * scale
  const position = Math.max(-limit, Math.min(limit, spring.position))
  return { position, velocity: position === spring.position ? spring.velocity : 0, momentum }
}

export type ScrollSample = { time: number; position: number; velocity: number }

export function sampleCardScroll(
  previous: ScrollSample | undefined,
  time: number,
  position: number,
) {
  const dt = previous ? (time - previous.time) / 1000 : 0
  const reset = !previous || dt <= 0 || dt > 0.1
  return {
    sample: {
      time,
      position,
      velocity: reset
        ? 0
        : previous.velocity +
          ((position - previous.position) / dt - previous.velocity) * (1 - Math.exp(-dt / 0.06)),
    },
    dt: reset ? 0 : dt,
    reset,
  }
}
