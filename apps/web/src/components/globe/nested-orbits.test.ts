import { expect, it } from 'vitest'
import { nestedOrbitBasis, nestedOrbitRadii } from './nested-orbits'

it('spreads seven circular orbits across distinct planes with three perpendicular axes', () => {
  const dot = (a: readonly number[], b: readonly number[]) =>
    a.reduce((sum, value, i) => sum + value * b[i]!, 0)
  const normals = Array.from({ length: 7 }, (_, index) => {
    const { u, v } = nestedOrbitBasis(index)
    expect(Math.hypot(...u)).toBeCloseTo(1)
    expect(Math.hypot(...v)).toBeCloseTo(1)
    expect(dot(u, v)).toBeCloseTo(0)
    return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  })
  for (let i = 0; i < normals.length; i++) {
    for (let j = i + 1; j < normals.length; j++) {
      const alignment = Math.abs(dot(normals[i]!, normals[j]!))
      expect(alignment).toBeLessThan(0.58)
      if (j < 3) expect(alignment).toBeCloseTo(0)
    }
  }
})

it('keeps planets and tubes clear of every other orbit and the outer rim', () => {
  const orbits = [
    { w: 1.3, dots: [{ r: 2.8 }, { r: 2.4 }] },
    { w: 0.8, dots: [{ r: 3 }] },
    { w: 1.7, dots: [{ r: 7.8 }, { r: 2.6 }] },
    { w: 1.1, dots: [] },
    { w: 1.5, dots: [{ r: 2.7 }] },
    { w: 0.9, dots: [{ r: 2.9 }] },
    { w: 1.4, dots: [{ r: 6.5 }, { r: 2.5 }] },
  ]
  const radii = nestedOrbitRadii(orbits)
  const extents = [2.8, 3, 7.8, 0.55, 2.7, 2.9, 6.5]
  const flatten = Math.cos((11 * Math.PI) / 180)
  for (let i = 0; i < radii.length; i++) {
    const rimGap =
      i < 2
        ? radii[i]! * flatten - extents[i]! - (340 + 1.43 / 2)
        : 340 * flatten - 1.43 / 2 - radii[i]! - extents[i]!
    expect(rimGap).toBeGreaterThan(1.2)
  }
  for (let i = 0; i < radii.length; i++) {
    for (let j = i + 1; j < radii.length; j++) {
      const minimumGap = (radii[i]! - radii[j]!) * flatten - extents[i]! - extents[j]!
      expect(minimumGap).toBeGreaterThan(1.2)
    }
  }
  expect(radii.at(-1)).toBeGreaterThan(275)
})

it('supports an empty globe without inventing an orbit', () => {
  expect(nestedOrbitRadii([])).toEqual([])
})
