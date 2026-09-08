import { describe, expect, it } from 'vitest'
import { membranePath } from './work-membrane-path'

function samplePath(path: string) {
  const values = path.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)!.map(Number)
  let x = values[0]!
  let y = values[1]!
  const points: [number, number][] = []
  for (let i = 2; i < values.length; i += 6) {
    const [x1, y1, x2, y2, x3, y3] = values.slice(i, i + 6) as [
      number,
      number,
      number,
      number,
      number,
      number,
    ]
    for (let step = 0; step <= 40; step++) {
      const t = step / 40
      const u = 1 - t
      points.push([
        u ** 3 * x + 3 * u ** 2 * t * x1 + 3 * u * t ** 2 * x2 + t ** 3 * x3,
        u ** 3 * y + 3 * u ** 2 * t * y1 + 3 * u * t ** 2 * y2 + t ** 3 * y3,
      ])
    }
    x = x3
    y = y3
  }
  return points
}

describe('the membrane stays outside the content padding', () => {
  it.each([
    { cardWidth: 280, cardHeight: 1050, bleedX: 10, paddingX: 24, paddingY: 56 },
    { cardWidth: 350, cardHeight: 950, bleedX: 10, paddingX: 24, paddingY: 56 },
    { cardWidth: 447, cardHeight: 662, bleedX: 12.5, paddingX: 24, paddingY: 56 },
    { cardWidth: 689, cardHeight: 600, bleedX: 19, paddingX: 24, paddingY: 56 },
    { cardWidth: 1050, cardHeight: 650, bleedX: 24, paddingX: 56, paddingY: 56 },
    { cardWidth: 1728, cardHeight: 650, bleedX: 24, paddingX: 56, paddingY: 56 },
  ])('holds its safe area at $cardWidth px through ambient and maximum input bends', (fixture) => {
    const { cardWidth, cardHeight, bleedX, paddingX, paddingY } = fixture
    const bleedY = 8
    const width = cardWidth + bleedX * 2
    const height = cardHeight + bleedY * 2
    for (let time = 0; time <= 120; time += 3) {
      for (const [pullX, pullY] of [
        [0, 0],
        [-0.013, -0.016],
        [0.013, 0.016],
        [-0.013, 0.016],
        [0.013, -0.016],
      ]) {
        const points = samplePath(
          membranePath(time, pullX, pullY, { width, height, bleedX, bleedY, paddingX }),
        )
        let intrusion = 0
        for (const [nx, ny] of points) {
          const x = nx * width
          const y = ny * height
          // Every edge stays inside its allocated background, including the corners.
          intrusion = Math.max(intrusion, -x, x - width, -y, y - height)
          if (y >= bleedY + paddingY && y <= height - bleedY - paddingY) {
            intrusion = Math.max(
              intrusion,
              x < width / 2 ? x - bleedX - paddingX / 2 : width - bleedX - paddingX / 2 - x,
            )
          }
          if (x >= bleedX + paddingX && x <= width - bleedX - paddingX) {
            intrusion = Math.max(
              intrusion,
              y < height / 2 ? y - bleedY - paddingY / 2 : height - bleedY - paddingY / 2 - y,
            )
          }
        }
        expect(intrusion).toBeLessThan(0.001)
        expect(points.at(-1)![0]).toBeCloseTo(points[0]![0], 12)
        expect(points.at(-1)![1]).toBeCloseTo(points[0]![1], 12)
      }
    }
  })
})
