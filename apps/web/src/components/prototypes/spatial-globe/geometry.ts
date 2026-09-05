// Throwaway GPU study. Generator copied from OrbitalSphere to preserve seed draw order.
type Vec3 = [number, number, number]
export interface Dot {
  t: number
  sp: number
  r: number
  col: string
  glow: boolean
}
export interface Arc {
  u: Vec3
  v: Vec3
  col: string
  op: number
  w: number
  dots: Dot[]
  colored: boolean
  i: number
}
const GEOMETRY = {
  seed: 1837,
  randomness: 0.2,
  lines: 7,
  lineOpacity: 1.15,
  lineWidth: 1.3,
  balls: 3,
  electronR: 7,
}
const palette = {
  accent: '#eb1000',
  accentDim: '#920a00',
  wire: '#e9edf5',
  dotCols: ['#eb1000', '#920a00', '#c8c8cc', '#8a8a8e'],
  strokeScale: 1,
}
export const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
const norm3 = (p: [number, number, number]): [number, number, number] => {
  const l = Math.hypot(p[0], p[1], p[2]) || 1
  return [p[0] / l, p[1] / l, p[2] / l]
}

const cross = (
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
]

/**
 * The export's generator, made pure. Same seeded sequence, same draws — but it
 * returns descriptors instead of writing `innerHTML`, so the structure renders
 * on the server and the animation only moves attributes afterwards.
 */
export function buildArcs(): Arc[] {
  let seed = GEOMETRY.seed
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const vary = (v: number, amt: number) => v * (1 + (rand() - 0.5) * 2 * GEOMETRY.randomness * amt)

  const arcs: Arc[] = []
  let electrons = 0

  for (let i = 0; i < GEOMETRY.lines; i++) {
    const th = rand() * Math.PI * 2
    const ph = Math.acos(2 * rand() - 1)
    const nv: [number, number, number] = [
      Math.sin(ph) * Math.cos(th),
      Math.sin(ph) * Math.sin(th),
      Math.cos(ph),
    ]
    let u = cross(nv, [0, 0, 1])
    if (Math.hypot(u[0], u[1], u[2]) < 0.01) u = cross(nv, [0, 1, 0])
    u = norm3(u)
    const v = cross(nv, u)

    const colored = i % 4 === 2
    const col = colored ? (i % 8 === 2 ? palette.accent : palette.accentDim) : palette.wire
    const op = Math.min(
      1,
      Math.max(
        0.05,
        vary((colored ? 0.55 : 0.3) * GEOMETRY.lineOpacity, 0.8) * palette.strokeScale,
      ),
    )
    const w = Math.max(0.2, vary(0.9 * GEOMETRY.lineWidth, 0.7))

    const dots: Dot[] = []
    const nn = Math.max(
      0,
      Math.round(vary(GEOMETRY.balls, 0.7) + (rand() - 0.5) * GEOMETRY.randomness * 2),
    )
    for (let k = 0; k < nn; k++) {
      dots.push({
        t: rand() * Math.PI * 2,
        sp: (0.05 + rand() * 0.12) * (rand() < 0.5 ? -1 : 1),
        r: Math.max(1, vary(GEOMETRY.electronR * 0.38, 0.6)),
        col: palette.dotCols[Math.floor(rand() * palette.dotCols.length)]!,
        glow: false,
      })
    }
    if (colored && electrons < 3) {
      dots.push({
        t: rand() * Math.PI * 2,
        sp: 0.08 + rand() * 0.1,
        r: Math.max(1.5, vary(GEOMETRY.electronR, 0.6)),
        col: palette.dotCols[electrons % palette.dotCols.length]!,
        glow: true,
      })
      electrons++
    }

    arcs.push({ u, v, col, op, w, dots, colored, i })
  }

  return arcs
}
