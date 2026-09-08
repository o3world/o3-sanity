import { membraneOutline, membraneSpline, type MembraneSize } from './work-membrane-path'

type Node = {
  x: number
  y: number
  nx: number
  ny: number
  displacement: number
  velocity: number
  min: number
  max: number
}
export type Membrane = { size: MembraneSize; nodes: Node[]; elapsed: number; phase: number }
export type MembraneInput = {
  ambient?: boolean
  accelerationX: number
  accelerationY: number
  pointer?: { x: number; y: number; velocityX: number; velocityY: number }
}

export function createMembrane(size: MembraneSize, phase = 0): Membrane {
  const points = membraneOutline(phase, 0, 0, size)
  const nodes = points.map(([x, y], i) => {
    const before = points[(i + points.length - 1) % points.length]!
    const after = points[(i + 1) % points.length]!
    const tx = (after[0] - before[0]) * size.width
    const ty = (after[1] - before[1]) * size.height
    const length = Math.hypot(tx, ty) || 1
    const nx = ty / length
    const ny = -tx / length
    const px = x * size.width
    const py = y * size.height
    // Allow a visible broad bend while retaining at least half the content padding.
    const allowance = Math.min(20, size.paddingX * 0.4)
    let min = -allowance
    let max = allowance
    for (const [position, normal, extent] of [
      [px, nx, size.width],
      [py, ny, size.height],
    ]) {
      if (Math.abs(normal!) < 0.00001) continue
      const a = (1 - position!) / normal!
      const b = (extent! - 1 - position!) / normal!
      min = Math.max(min, Math.min(a, b))
      max = Math.min(max, Math.max(a, b))
    }
    return { x: px, y: py, nx, ny, displacement: 0, velocity: 0, min, max }
  })
  return { size, nodes, elapsed: 0, phase }
}

export function resetMembrane(membrane: Membrane, settle = false) {
  for (const node of membrane.nodes) {
    node.velocity = 0
    if (settle) node.displacement = 0
  }
}

const responseSpeed = 1.35

/** One damped perimeter: local forces persist and spread through neighboring nodes. */
export function stepMembrane(membrane: Membrane, input: MembraneInput, dt: number) {
  if (dt <= 0) return
  const steps = Math.ceil(Math.min(dt, 0.05) * 240)
  const h = Math.min(dt, 0.05) / steps
  const { nodes } = membrane
  const forces = nodes.map((node) => {
    let force = -(input.accelerationX * node.nx + input.accelerationY * node.ny) * 0.9
    if (input.pointer) {
      const distance = Math.hypot(input.pointer.x - node.x, input.pointer.y - node.y)
      const influence = Math.max(0, 1 - distance / 160) ** 2
      const normalSpeed = input.pointer.velocityX * node.nx + input.pointer.velocityY * node.ny
      const tangentSpeed = -input.pointer.velocityX * node.ny + input.pointer.velocityY * node.nx
      const along =
        ((node.x - input.pointer.x) * -node.ny + (node.y - input.pointer.y) * node.nx) / 100
      force += (normalSpeed + tangentSpeed * along * 0.7) * influence
    }
    return Math.max(-1800, Math.min(1800, force))
  })
  for (let step = 0; step < steps; step++) {
    membrane.elapsed += h
    // Update all velocities before positions so coupling does not depend on traversal order.
    nodes.forEach((node, i) => {
      const before = nodes[(i + nodes.length - 1) % nodes.length]!
      const after = nodes[(i + 1) % nodes.length]!
      const angle = Math.atan2(
        (node.y - membrane.size.height / 2) / membrane.size.height,
        (node.x - membrane.size.width / 2) / membrane.size.width,
      )
      const ambient =
        input.ambient === false
          ? 0
          : 1150 * Math.sin(membrane.elapsed * 1.1 + membrane.phase + angle * 2) +
            400 * Math.sin(membrane.elapsed * 0.7 - membrane.phase + angle)
      const tension = (before.displacement + after.displacement - 2 * node.displacement) * 100
      node.velocity +=
        ((forces[i]! + ambient + tension - node.displacement * 144) * responseSpeed ** 2 -
          node.velocity * 18 * responseSpeed) *
        h
    })
    for (const node of nodes) {
      const next = node.displacement + node.velocity * h
      node.displacement = Math.max(node.min, Math.min(node.max, next))
      if (next !== node.displacement) node.velocity = 0
    }
  }
}

export function springMembranePath(membrane: Membrane) {
  return membraneSpline(
    membrane.nodes.map(
      (node) =>
        [
          (node.x + node.nx * node.displacement) / membrane.size.width,
          (node.y + node.ny * node.displacement) / membrane.size.height,
        ] as const,
    ),
  )
}
