import { expect, it } from 'vitest'
import { workStarCameraY } from './work-starfield-camera'

it('joins a restored position immediately, then eases scrolling in either direction', () => {
  const restored = workStarCameraY(undefined, 803, 1 / 60)
  expect(restored).toBe(803)
  expect(workStarCameraY(restored, 803, 1 / 60)).toBe(803)

  const down = workStarCameraY(restored, 963, 1 / 60)
  expect(down).toBeGreaterThan(restored)
  expect(down).toBeLessThan(963)
  const up = workStarCameraY(down, 643, 1 / 60)
  expect(up).toBeLessThan(down)
  expect(up).toBeGreaterThan(643)

  expect(workStarCameraY(undefined, 803, 0)).toBe(803)
  expect(workStarCameraY(restored, 963, 0)).toBe(restored)
})
