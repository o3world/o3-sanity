export type MembraneSize = {
  width: number
  height: number
  bleedX: number
  bleedY: number
  paddingX: number
}

const initialSize: MembraneSize = { width: 1776, height: 666, bleedX: 24, bleedY: 8, paddingX: 80 }
const clamp = (value: number) => Math.max(-1, Math.min(1, value))

/** The background owns the motion allowance; the card's content box stays intact. */
export function membraneOutline(time: number, size = initialSize) {
  const { width, height, bleedX, bleedY, paddingX } = size
  const left = bleedX / 2
  const top = bleedY / 2
  const right = width - left
  const bottom = height - top
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(96, paddingX * 1.8, width / 4, height / 4)
  const [tl, tr, br, bl] = [0.75, 0.9, 0.82, 0.68].map(
    (speed) => radius * (0.86 + Math.cos(time * speed) * 0.14),
  ) as [number, number, number, number]
  const outline = [
    [left, top + tl],
    [left, top],
    [left + tl, top],
    [left + tl + (right - tr - left - tl) / 3, top],
    [left + tl + ((right - tr - left - tl) * 2) / 3, top],
    [right - tr, top],
    [right, top],
    [right, top + tr],
    [right, top + tr + (bottom - br - top - tr) / 3],
    [right, top + tr + ((bottom - br - top - tr) * 2) / 3],
    [right, bottom - br],
    [right, bottom],
    [right - br, bottom],
    [right - br - (right - br - left - bl) / 3, bottom],
    [right - br - ((right - br - left - bl) * 2) / 3, bottom],
    [left + bl, bottom],
    [left, bottom],
    [left, bottom - bl],
    [left, bottom - bl - (bottom - bl - top - tl) / 3],
    [left, bottom - bl - ((bottom - bl - top - tl) * 2) / 3],
  ]
  const points = outline.map(([x = 0, y = 0]) => {
    const nx = (x - cx) / cx
    const ny = (y - cy) / cy
    const swayX = Math.sin(time * 0.7) * ny * 0.65 + Math.cos(time * 0.5) * (ny * ny - 0.4) * 0.65
    const swayY = Math.cos(time * 0.6) * nx * 0.65 + Math.sin(time * 0.55) * (nx * nx - 0.4) * 0.65
    return [
      (x + clamp(swayX) * Math.max(0, left - 1)) / width,
      (y + clamp(swayY) * Math.max(0, top - 1)) / height,
    ] as const
  })
  return points
}

export function membranePath(time: number, size = initialSize) {
  return membraneSpline(membraneOutline(time, size))
}

export function membraneSpline(points: readonly (readonly [number, number])[]) {
  const count = points.length
  const at = (i: number) => points[(i + count) % count]!
  let path = ''
  // A periodic cubic B-spline keeps position, tangent and curvature continuous at every join.
  for (let i = 0; i < count; i++) {
    const [a, b, c, d] = [at(i), at(i + 1), at(i + 2), at(i + 3)] as const
    if (i === 0) path = `M ${(a[0] + 4 * b[0] + c[0]) / 6} ${(a[1] + 4 * b[1] + c[1]) / 6}`
    path += ` C ${(2 * b[0] + c[0]) / 3} ${(2 * b[1] + c[1]) / 3}, ${(b[0] + 2 * c[0]) / 3} ${(b[1] + 2 * c[1]) / 3}, ${(b[0] + 4 * c[0] + d[0]) / 6} ${(b[1] + 4 * c[1] + d[1]) / 6}`
  }
  return path + ' Z'
}
