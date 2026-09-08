import { expect, it } from 'vitest'
import {
  createMembrane,
  resetMembrane,
  springMembranePath,
  stepMembrane,
} from './work-membrane-spring'

const size = { width: 1100, height: 566, bleedX: 24, bleedY: 8, paddingX: 56 }
const idle = { accelerationX: 0, accelerationY: 0, ambient: false }

it('recovers after an impulse when ambient forcing is disabled', () => {
  const m = createMembrane(size)
  const rest = springMembranePath(m)
  for (let i = 0; i < 120; i++) stepMembrane(m, idle, 1 / 60)
  expect(springMembranePath(m)).toBe(rest)
  stepMembrane(m, { ...idle, accelerationY: -1000 }, 1 / 60)
  expect(springMembranePath(m)).not.toBe(rest)
  for (let i = 0; i < 240; i++) stepMembrane(m, idle, 1 / 60)
  expect(Math.max(...m.nodes.map((n) => Math.abs(n.displacement)))).toBeLessThan(0.001)
  expect(Math.max(...m.nodes.map((n) => Math.abs(n.velocity)))).toBeLessThan(0.001)
})

it('responds locally to the pointer and transfers motion to an unforced neighbor', () => {
  const m = createMembrane(size)
  const point = m.nodes[3]!
  const input = { ...idle, pointer: { x: point.x, y: point.y, velocityX: 0, velocityY: 1200 } }
  for (let i = 0; i < 12; i++) stepMembrane(m, input, 1 / 120)
  const near = m.nodes.filter((n) => Math.hypot(n.x - point.x, n.y - point.y) < 100)
  const far = m.nodes.filter((n) => Math.hypot(n.x - point.x, n.y - point.y) > size.width / 2)
  expect(Math.max(...near.map((n) => Math.abs(n.displacement)))).toBeGreaterThan(0.5)
  expect(Math.max(...far.map((n) => Math.abs(n.displacement)))).toBeLessThan(
    Math.max(...near.map((n) => Math.abs(n.displacement))) * 0.1,
  )
  const neighbor = m.nodes[2]!
  for (let i = 0; i < 24; i++) stepMembrane(m, idle, 1 / 120)
  expect(Math.abs(neighbor.displacement)).toBeGreaterThan(0.0001)
})

it('retains momentum on reversal and discards it when paused', () => {
  const m = createMembrane(size)
  stepMembrane(m, { ...idle, accelerationY: -600 }, 1 / 60)
  const n = m.nodes[3]!
  const velocity = n.velocity
  stepMembrane(m, { ...idle, accelerationY: 600 }, 1 / 1000)
  expect(n.velocity * velocity).toBeGreaterThan(0)
  const pose = springMembranePath(m)
  resetMembrane(m)
  expect(springMembranePath(m)).toBe(pose)
  expect(m.nodes.every((n) => n.velocity === 0)).toBe(true)
})

it('keeps bounded geometry across mobile sizes, phases and extreme input', () => {
  for (const width of [300, 398, 1100, 1776]) {
    for (const phase of [0, 1.7, 3.4]) {
      const fixture = { ...size, width, paddingX: width < 700 ? 24 : 56 }
      const m = createMembrane(fixture, phase)
      for (let i = 0; i < 240; i++) {
        stepMembrane(
          m,
          { accelerationX: Math.sin(i) * 100000, accelerationY: Math.cos(i) * 100000 },
          1 / 30,
        )
        for (const n of m.nodes) {
          expect(Math.abs(n.displacement)).toBeLessThanOrEqual(Math.min(20, fixture.paddingX * 0.4))
          expect(n.x + n.nx * n.displacement).toBeGreaterThanOrEqual(0)
          expect(n.x + n.nx * n.displacement).toBeLessThanOrEqual(width)
          expect(n.y + n.ny * n.displacement).toBeGreaterThanOrEqual(0)
          expect(n.y + n.ny * n.displacement).toBeLessThanOrEqual(fixture.height)
          const x = n.x + n.nx * n.displacement
          const y = n.y + n.ny * n.displacement
          if (y > fixture.bleedY + 56 && y < fixture.height - fixture.bleedY - 56) {
            expect(x < width / 2 ? x : width - x).toBeLessThan(fixture.bleedX + fixture.paddingX)
          }
          if (
            x > fixture.bleedX + fixture.paddingX &&
            x < width - fixture.bleedX - fixture.paddingX
          ) {
            expect(y < fixture.height / 2 ? y : fixture.height - y).toBeLessThan(
              fixture.bleedY + 56,
            )
          }
        }
      }
    }
  }
})

it('keeps replayed motion consistent at 30, 60 and 120Hz', () => {
  const replay = (hz: number) => {
    const m = createMembrane(size)
    for (let i = 0; i < hz; i++)
      stepMembrane(m, { ...idle, accelerationY: i < hz / 2 ? -500 : 500 }, 1 / hz)
    return m.nodes.map((n) => n.displacement)
  }
  const fast = replay(120)
  for (const hz of [30, 60])
    replay(hz).forEach((d, i) => expect(Math.abs(d - fast[i]!)).toBeLessThan(0.01))
})

it.each(['top', 'bottom'] as const)(
  'responds to horizontal cursor sweeps along the %s without scrolling',
  (edge) => {
    const m = createMembrane(size)
    const y = edge === 'top' ? 4 : size.height - 4
    for (let i = 0; i < 20; i++) {
      stepMembrane(
        m,
        { ...idle, pointer: { x: size.width / 2 - 60, y, velocityX: 1400, velocityY: 0 } },
        1 / 120,
      )
    }
    const nearby = m.nodes.filter(
      (n) => Math.abs(n.y - y) < 30 && Math.abs(n.x - size.width / 2) < 160,
    )
    expect(Math.max(...nearby.map((n) => Math.abs(n.displacement)))).toBeGreaterThan(0.1)
  },
)

it('keeps a visible idle flex and blends interaction back into that same motion', () => {
  const calm = createMembrane(size)
  const touched = createMembrane(size)
  const naturalIdle = { accelerationX: 0, accelerationY: 0 }
  const rest = springMembranePath(calm)
  for (let i = 0; i < 120; i++) {
    stepMembrane(calm, naturalIdle, 1 / 60)
    stepMembrane(touched, { ...naturalIdle, accelerationY: i === 30 ? -1000 : 0 }, 1 / 60)
  }
  expect(springMembranePath(calm)).not.toBe(rest)
  expect(Math.max(...calm.nodes.map((n) => Math.abs(n.displacement)))).toBeGreaterThan(1)
  for (let i = 0; i < 120; i++) {
    stepMembrane(calm, naturalIdle, 1 / 60)
    stepMembrane(touched, naturalIdle, 1 / 60)
  }
  calm.nodes.forEach((n, i) =>
    expect(Math.abs(n.displacement - touched.nodes[i]!.displacement)).toBeLessThan(0.001),
  )
  const frozen = springMembranePath(calm)
  stepMembrane(calm, naturalIdle, 0)
  expect(springMembranePath(calm)).toBe(frozen)
})
