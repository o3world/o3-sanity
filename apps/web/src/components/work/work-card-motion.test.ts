import { expect, it } from 'vitest'
import {
  cardProfile,
  stepScrollCard,
  type CardScrollState,
  cardDragTarget,
  cardTravelScale,
  sampleCardScroll,
  stepCardSpring,
  type ScrollSample,
  type CardSpring,
} from './work-card-motion'

function replay(slug: string, hz: number) {
  const profile = cardProfile(`/work/${slug}`)
  let spring: CardScrollState = { position: 0, velocity: 0, momentum: 0 }
  let previous: ScrollSample | undefined
  let scroll = 0
  const samples: CardSpring[] = []
  for (let i = 0; i <= hz * 3; i++) {
    const speed = i <= hz ? 200 : i <= hz * 1.5 ? -400 : 0
    if (i) scroll += speed / hz
    const frame = sampleCardScroll(previous, (i * 1000) / hz, scroll)
    previous = frame.sample
    spring = stepScrollCard(spring, profile, frame.sample.velocity, 1, frame.dt)
    samples.push(spring)
  }
  return samples
}

it('makes moderate scrolling perceptible and gives each object a distinct displacement', () => {
  const ironman = replay('case-studies-ironman-digital-experience-drupal-acquia', 120)
  const vertex = replay('vertex', 120)
  const caron = replay('caron', 120)
  for (const samples of [ironman, vertex, caron]) {
    expect(samples[36]!.position).toBeLessThan(-5)
    expect(samples[36]!.position).toBeGreaterThan(-8)
    expect(samples[180]!.position).toBeGreaterThan(0)
    expect(Math.abs(samples.at(-1)!.position)).toBeLessThan(1)
    expect(Math.abs(samples.at(-1)!.velocity)).toBeLessThan(2)
  }
  expect(vertex[120]!.position).toBeGreaterThan(ironman[120]!.position + 3)
  expect(caron[120]!.position).toBeLessThan(ironman[120]!.position - 2)
})

it('retains opposing momentum on reversal instead of cutting the velocity', () => {
  const state = { position: 4, velocity: 60 }
  const next = stepCardSpring(state, -20, 0.21, 1 / 120)
  expect(next.position).toBeGreaterThan(state.position)
  expect(next.velocity).toBeGreaterThan(0)
  expect(next.velocity).toBeLessThan(state.velocity)
  const held = stepCardSpring(state, -20, 0.21, 0)
  expect(held.position).toBeCloseTo(state.position)
  expect(held.velocity).toBeCloseTo(state.velocity)
})

it('preserves vertical clearance even when neighboring cards are driven in opposite directions', () => {
  for (const mobile of [false, true]) {
    for (const gap of [56, 80, 112]) {
      const profiles = [cardProfile('/work/vertex'), cardProfile('/work/caron')]
      const limits = profiles.map((p) => p.limit * cardTravelScale(p, mobile, gap))
      expect(gap - limits[0]! - limits[1]! - 19).toBeGreaterThanOrEqual(24 - 0.00001)
      for (const p of profiles) {
        const scale = cardTravelScale(p, mobile, gap)
        let state = { position: 0, velocity: 0 }
        for (let i = 0; i < 1200; i++) {
          const speed = Math.floor(i / 29) % 2 ? -8000 : 8000
          state = stepCardSpring(state, cardDragTarget(p, speed, scale), p.response, 1 / 60)
          expect(Math.abs(state.position)).toBeLessThanOrEqual(p.limit * scale + 0.00001)
        }
      }
    }
  }
})

it('keeps the same choreography within one pixel at 60 and 120Hz', () => {
  for (const slug of ['vertex', 'caron', 'case-studies-ironman-digital-experience-drupal-acquia']) {
    const slow = replay(slug, 60)
    const fast = replay(slug, 120)
    slow.forEach((state, i) =>
      expect(Math.abs(state.position - fast[i * 2]!.position)).toBeLessThan(1),
    )
  }
})

it('reseeds restored positions and long frame gaps without a scroll kick', () => {
  const initial = sampleCardScroll(undefined, 1000, 2400)
  expect(initial.sample.velocity).toBe(0)
  const moving = sampleCardScroll(initial.sample, 1016, 2420)
  expect(moving.sample.velocity).toBeGreaterThan(0)
  const returned = sampleCardScroll(moving.sample, 3000, 600)
  expect(returned.reset).toBe(true)
  expect(returned.sample.velocity).toBe(0)
  expect(returned.dt).toBe(0)
  const paused = sampleCardScroll(undefined, 3016, 600)
  expect(paused.sample.velocity).toBe(0)
})

it('uses stable case identities and scales tiny inputs without a minimum kick', () => {
  const profile = cardProfile('/work/vertex?preview=1')
  expect(profile).toEqual(cardProfile('/work/vertex/'))
  expect(cardDragTarget(profile, 0, 1)).toBeCloseTo(0)
  expect(cardDragTarget(profile, 1, 1)).toBeLessThan(0)
  expect(cardDragTarget(profile, 1, 1)).toBeGreaterThan(-0.1)
  expect(cardDragTarget(profile, -200, 0.6)).toBeCloseTo(-cardDragTarget(profile, 200, 1) * 0.6)
})

it('gives a fast flick more travel and a longer release than a slow scroll over the same distance', () => {
  const profile = cardProfile('/work/caron')
  const gesture = (speed: number, duration: number) => {
    let state: CardScrollState = { position: 0, velocity: 0, momentum: 0 }
    let sample: ScrollSample | undefined
    let position = 0
    let peak = 0
    let settledAt = 0
    for (let i = 0; i <= Math.round((duration + 3) * 120); i++) {
      const t = i / 120
      if (i && t <= duration) position += speed / 120
      const frame = sampleCardScroll(sample, t * 1000, position)
      sample = frame.sample
      state = stepScrollCard(state, profile, frame.sample.velocity, 1, frame.dt)
      peak = Math.max(peak, Math.abs(state.position))
      if (t > duration && (Math.abs(state.position) > 0.5 || Math.abs(state.velocity) > 1))
        settledAt = t - duration
    }
    return { peak, settledAt, position }
  }
  const slow = gesture(100, 2)
  const fast = gesture(1000, 0.2)
  expect(fast.position).toBeCloseTo(slow.position)
  expect(fast.peak).toBeGreaterThan(slow.peak * 1.5)
  expect(fast.settledAt).toBeGreaterThan(slow.settledAt + 0.1)
})

it('retains stronger scroll momentum even when two releases start at the same displacement', () => {
  const profile = cardProfile('/work/vertex')
  let gentle: CardScrollState = { position: -10, velocity: 0, momentum: 100 }
  let strong: CardScrollState = { position: -10, velocity: 0, momentum: 1500 }
  for (let i = 0; i < 24; i++) {
    gentle = stepScrollCard(gentle, profile, 0, 1, 1 / 120)
    strong = stepScrollCard(strong, profile, 0, 1, 1 / 120)
  }
  expect(Math.abs(strong.position)).toBeGreaterThan(Math.abs(gentle.position) + 1)
})
