import { afterEach, expect, it, vi } from 'vitest'
import { createSpatialMotion } from './spatial-motion'

afterEach(() => {
  vi.restoreAllMocks()
})

it('starts unpaused on the performance timeline and keeps a stable snapshot reader', () => {
  const motion = createSpatialMotion()
  const { getSnapshot } = motion

  expect(getSnapshot()).toBe(false)
  expect(motion.now(0)).toBe(0)
  expect(motion.now(12_345)).toBe(12_345)

  motion.setPaused(true, 13_000)
  expect(getSnapshot()).toBe(true)
  expect(motion.getSnapshot).toBe(getSnapshot)

  motion.setPaused(false, 14_000)
  expect(getSnapshot()).toBe(false)
  expect(motion.getSnapshot).toBe(getSnapshot)
})

it('excludes multiple long pauses without jumping or resetting on resume', () => {
  const motion = createSpatialMotion()
  const pauses = [
    { start: 1_250, end: 61_250, virtual: 1_250 },
    { start: 62_000, end: 3_662_000, virtual: 2_000 },
    { start: 3_662_500, end: 8_662_500, virtual: 2_500 },
  ]

  for (const { start, end, virtual } of pauses) {
    expect(motion.now(start)).toBe(virtual)

    motion.setPaused(true, start)
    expect(motion.now(start)).toBe(virtual)
    expect(motion.now(end - 1)).toBe(virtual)

    motion.setPaused(false, end)
    expect(motion.now(end)).toBe(virtual)
    expect(motion.now(end + 250)).toBe(virtual + 250)
  }
})

it('handles a pause at zero and makes repeated pause and resume calls idempotent', () => {
  const motion = createSpatialMotion()

  motion.setPaused(false, 0)
  motion.setPaused(true, 0)
  motion.setPaused(true, 10_000)
  expect(motion.getSnapshot()).toBe(true)
  expect(motion.now(50_000)).toBe(0)

  motion.setPaused(false, 100_000)
  expect(motion.now(100_025)).toBe(25)

  motion.setPaused(false, 200_000)
  expect(motion.getSnapshot()).toBe(false)
  expect(motion.now(200_025)).toBe(100_025)
})

it('shares one timeline with simultaneous placements and consumers arriving later', () => {
  const motion = createSpatialMotion()
  const hero = motion.now
  const cta = motion.now

  expect([hero(500), cta(500)]).toEqual([500, 500])

  motion.setPaused(true, 1_000)
  const mountedWhilePaused = motion.now
  expect(mountedWhilePaused(40_000)).toBe(1_000)

  motion.setPaused(false, 61_000)
  const mountedAfterResume = motion.now
  const consumers = [hero, cta, mountedWhilePaused, mountedAfterResume]

  for (const timestamp of [61_000, 62_000]) {
    expect(consumers.map((sample) => sample(timestamp))).toEqual(Array(4).fill(timestamp - 60_000))
  }
})

it('notifies each subscriber once per state change and honors unsubscribe', () => {
  const motion = createSpatialMotion()
  const observations: Array<[boolean, number]> = []
  const first = vi.fn(() => {
    observations.push([motion.getSnapshot(), motion.now(1_000)])
  })
  const second = vi.fn()
  const unsubscribeFirst = motion.subscribe(first)
  const unsubscribeSecond = motion.subscribe(second)

  motion.setPaused(false, 0)
  motion.now(50)
  expect(first).not.toHaveBeenCalled()
  expect(second).not.toHaveBeenCalled()

  motion.setPaused(true, 100)
  motion.setPaused(true, 500)
  motion.now(750)
  expect(first).toHaveBeenCalledTimes(1)
  expect(second).toHaveBeenCalledTimes(1)

  motion.setPaused(false, 1_000)
  motion.setPaused(false, 1_025)
  expect(observations).toEqual([
    [true, 100],
    [false, 100],
  ])
  expect(first).toHaveBeenCalledTimes(2)
  expect(second).toHaveBeenCalledTimes(2)

  unsubscribeFirst()
  unsubscribeFirst()
  motion.setPaused(true, 1_050)
  motion.setPaused(false, 1_100)
  expect(first).toHaveBeenCalledTimes(2)
  expect(second).toHaveBeenCalledTimes(4)

  unsubscribeSecond()
  motion.setPaused(true, 1_200)
  motion.setPaused(false, 2_000)
  expect(second).toHaveBeenCalledTimes(4)
  expect(motion.now(2_000)).toBe(250)
})

it('uses performance.now by default without reading it during creation', () => {
  const clock = vi.spyOn(performance, 'now').mockReturnValue(100)
  const motion = createSpatialMotion()

  expect(clock).not.toHaveBeenCalled()

  motion.setPaused(true)
  expect(motion.now(60_000)).toBe(100)

  clock.mockReturnValue(60_100)
  motion.setPaused(false)
  expect(motion.now(60_125)).toBe(125)
  expect(clock).toHaveBeenCalledTimes(2)

  motion.setPaused(true, 60_150)
  expect(motion.now(100_000)).toBe(150)
  expect(clock).toHaveBeenCalledTimes(2)
})
