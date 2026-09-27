import { expect, it } from 'vitest'

import { dotCircleArtwork } from './dotCircleArtwork'

type Point = readonly [number, number]

const drawn = (dots: readonly Point[], x: number, y: number) =>
  dots.some(([dx, dy]) => dx === x && dy === y)

/** Whether a dot centre falls inside one of the icon's knocked-out 4px cells. */
const knockedOut = (icon: Parameters<typeof dotCircleArtwork>[0], x: number, y: number) =>
  dotCircleArtwork(icon).knockouts.some(([cx, cy]) => x > cx && x < cx + 4 && y > cy && y < cy + 4)

it('draws only whole dots, dropping the edge dots the Figma export slices in half', () => {
  const { dots } = dotCircleArtwork('squad')
  expect(drawn(dots, 33, 33)).toBe(true)
  // Touching the circle's edge but whole.
  expect(drawn(dots, 1, 33)).toBe(true)
  expect(drawn(dots, 33, 65)).toBe(true)
  // Straddling the edge: the exported SVG clips these to slivers.
  expect(drawn(dots, 9, 9)).toBe(false)
  expect(drawn(dots, 5, 13)).toBe(false)
})

it('knocks out each pictogram on the Figma cells', () => {
  // Arrow: shaft, head and tip are cut; the dot past the tip is not.
  expect(knockedOut('arrow', 17, 33)).toBe(true)
  expect(knockedOut('arrow', 37, 21)).toBe(true)
  expect(knockedOut('arrow', 49, 33)).toBe(true)
  expect(knockedOut('arrow', 53, 33)).toBe(false)
  // Heart: the notch between the lobes stays dotted, the point is cut.
  expect(knockedOut('heart', 33, 21)).toBe(false)
  expect(knockedOut('heart', 25, 21)).toBe(true)
  expect(knockedOut('heart', 33, 49)).toBe(true)
  expect(knockedOut('heart', 33, 53)).toBe(false)
  // Network: a node's ring is cut, its centre shows a dot, a diagonal link is cut.
  expect(knockedOut('network', 29, 29)).toBe(true)
  expect(knockedOut('network', 33, 33)).toBe(false)
  expect(knockedOut('network', 25, 25)).toBe(true)
  // Key: the bow is cut around a dotted hole, and the tip is cut.
  expect(knockedOut('key', 13, 29)).toBe(true)
  expect(knockedOut('key', 21, 25)).toBe(false)
  expect(knockedOut('key', 57, 33)).toBe(true)
})

it('gives squad and team a plain disc, as their Figma exports are', () => {
  expect(dotCircleArtwork('squad').knockouts).toEqual([])
  expect(dotCircleArtwork('team').knockouts).toEqual([])
})
