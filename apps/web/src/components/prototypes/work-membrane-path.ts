type MembraneSize = {
  width: number
  height: number
  bleedX: number
  bleedY: number
  paddingX: number
}

const initialSize: MembraneSize = { width: 1776, height: 666, bleedX: 24, bleedY: 8, paddingX: 80 }
const clamp = (value: number) => Math.max(-1, Math.min(1, value))

/** The background owns the motion allowance; the card's content box stays intact. */
export function membranePath(time: number, pullX = 0, pullY = 0, size = initialSize) {
  const { width, height, bleedX, bleedY, paddingX } = size
  const left = bleedX / 2
  const top = bleedY / 2
  const right = width - left
  const bottom = height - top
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(96, paddingX * 2, width / 4, height / 4)
  const outline = [
    [left, top + radius],
    [left, top],
    [left + radius, top],
    [cx, top],
    [right - radius, top],
    [right, top],
    [right, top + radius],
    [right, cy],
    [right, bottom - radius],
    [right, bottom],
    [right - radius, bottom],
    [cx, bottom],
    [left + radius, bottom],
    [left, bottom],
    [left, bottom - radius],
    [left, cy],
  ]
  const points = outline.map(([x = 0, y = 0]) => {
    const nx = (x - cx) / cx
    const ny = (y - cy) / cy
    const swayX =
      Math.sin(time * 0.7) * ny * 0.45 +
      Math.cos(time * 0.5) * (ny * ny - 0.4) * 0.45 +
      clamp(pullX / 0.013) * ny * 0.25
    const swayY =
      Math.cos(time * 0.6) * nx * 0.45 +
      Math.sin(time * 0.55) * (nx * nx - 0.4) * 0.45 +
      clamp(pullY / 0.016) * nx * 0.25
    return [
      (x + clamp(swayX) * Math.max(0, left - 1)) / width,
      (y + clamp(swayY) * Math.max(0, top - 1)) / height,
    ] as const
  })
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
