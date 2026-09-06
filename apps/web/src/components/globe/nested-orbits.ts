type OrbitEnvelope = { w: number; dots: readonly { r: number }[] }
type Vector = readonly [number, number, number]

// Three perpendicular planes, with four diagonal planes filling the spaces between them.
const orbitNormals: readonly Vector[] = [
  [1, 0, 0],
  [0, 0, 1],
  [0, 1, 0],
  [1, 1, 1],
  [1, -1, 1],
  [-1, 1, 1],
  [1, 1, -1],
]

function orient([x, y, z]: Vector): Vector {
  const yaw = (25 * Math.PI) / 180
  const pitch = (20 * Math.PI) / 180
  const depth = z * Math.cos(yaw) - x * Math.sin(yaw)
  return [
    x * Math.cos(yaw) + z * Math.sin(yaw),
    y * Math.cos(pitch) - depth * Math.sin(pitch),
    y * Math.sin(pitch) + depth * Math.cos(pitch),
  ]
}

export function nestedOrbitBasis(index: number): { u: Vector; v: Vector } {
  const normal = orbitNormals[index % orbitNormals.length]!
  const length = Math.hypot(...normal)
  const [x, y, z] = normal.map((value) => value / length) as [number, number, number]
  const across = Math.hypot(x, y)
  const u: Vector = across > 0 ? [-y / across, x / across, 0] : [1, 0, 0]
  const v: Vector = [-z * u[1], z * u[0], x * u[1] - y * u[0]]
  return { u: orient(u), v: orient(v) }
}

/** Keep each orbit's tube and planets clear of the other orbits and the rim. */
export function nestedOrbitRadii(orbits: readonly OrbitEnvelope[]): number[] {
  const flatten = Math.cos((11 * Math.PI) / 180)
  const gap = 1.25
  const rimInnerEdge = 340 * flatten - 1.43 / 2
  const rimOuterEdge = 340 + 1.43 / 2
  const extents = orbits.map((orbit) => Math.max(orbit.w / 2, ...orbit.dots.map((dot) => dot.r)))
  const outsideCount = Math.min(2, orbits.length)
  const radii: number[] = []
  // Two orbits surround the glow; the remaining shells sit inside it.
  let outerRadius = rimOuterEdge / flatten
  let outerExtent = 0
  for (let i = outsideCount - 1; i >= 0; i--) {
    outerRadius += (outerExtent + extents[i]! + gap) / flatten
    radii[i] = outerRadius
    outerExtent = extents[i]!
  }
  let previousRadius = rimInnerEdge
  let previousExtent = 0
  for (let index = outsideCount; index < orbits.length; index++) {
    const extent = extents[index]!
    const spacing = previousExtent + extent + gap
    const radius = previousRadius - spacing / (index === outsideCount ? 1 : flatten)
    previousRadius = radius
    previousExtent = extent
    radii[index] = radius
  }
  return radii
}
