import { expect, it } from 'vitest'
import { createSkyHandoff } from './sky-handoff'

it('holds the exact starting pose until GPU completion and the crossfade have finished', () => {
  const sky = createSkyHandoff()
  expect(sky.sample(1000, 1 / 60, false)).toEqual({ elapsed: 0, step: 0, mix: 0 })
  sky.reveal(1000, 200)
  expect(sky.sample(1100, 1 / 60, false)).toEqual({ elapsed: 0, step: 0, mix: 0 })
  expect(sky.sample(1200, 1 / 60, false)).toEqual({ elapsed: 0, step: 0, mix: 0 })
  const ramp = sky.sample(1500, 1 / 60, false)
  expect(ramp.mix).toBe(0.5)
  expect(ramp.elapsed).toBeCloseTo(1 / 120)
  expect(sky.sample(1800, 1 / 60, false).mix).toBe(1)
})

it('keeps reduced motion static and bounds the first step after a long frame', () => {
  const sky = createSkyHandoff()
  sky.reveal(0, 0)
  expect(sky.sample(2000, 2, true)).toEqual({ elapsed: 0, step: 0, mix: 0 })
  expect(sky.sample(3000, 3, false).step).toBe(1 / 20)
})
