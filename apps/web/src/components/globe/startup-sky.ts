/** Seed and project the GPU sky's time-zero scene without loading the GPU runtime. */
export function createStartupSky(hash: (seed: number) => number) {
  const mix = (a: number, b: number, t: number) => a + (b - a) * t
  const smooth = (a: number, b: number, value: number) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)))
    return t * t * (3 - 2 * t)
  }
  const stars = Array.from({ length: 4180 }, (_, instance) => {
    const n = instance + 1837
    const azimuth = hash(n) * 6.2831853
    const latitude = hash(n + 1) * 2 - 1
    const radial = Math.sqrt(1 - latitude * latitude)
    const nearby = instance >= 4000
    const backfield = instance >= 1900 && !nearby
    const radius = nearby
      ? 8000 + 12000 * hash(n + 2)
      : backfield
        ? 5000000 + 4000000 * hash(n + 2)
        : 10000 * 900 ** (hash(n + 2) ** 0.65)
    const x = Math.cos(azimuth) * radial * radius
    const y = Math.sin(azimuth) * radial * radius
    const distance = 1650 + latitude * radius
    const cameraDepth = Math.max(0, Math.min(1, Math.log(radius / 8000) / Math.log(1125)))
    const travel = Math.hypot(x, y, distance) / (900 * 32 ** cameraDepth)
    const depth = Math.max(0, Math.min(1, Math.log(radius / 10000) / Math.log(900)))
    const dust = nearby ? 0.7 + 0.3 * hash(n + 4) : smooth(0.42, 0.94, hash(n + 4))
    const pointRadius = Math.max(
      0.38,
      Math.min(
        1.85,
        (0.55 + hash(n + 7) ** 2 * 1.3) * mix(1.08, 0.8, depth) * (backfield ? 0.7 : 1),
      ),
    )
    const background = (0.3 + hash(n + 8) ** 1.8 * 0.7) * mix(1, 0.8, dust) * mix(1, 0.72, depth)
    const opacity =
      mix(background, 0.98, smooth(0.65, 0.98, hash(n + 7))) *
      smooth(100, 400, distance) *
      (backfield ? 0.72 : 1) *
      0.45
    const warmth = hash(n + 9)
    const color = [mix(0.88, 1, warmth), mix(0.92, 0.95, warmth), mix(1, 0.88, warmth)].map(
      (channel) => Math.round(mix(channel, 1, 0.375) * 255),
    )
    return {
      x,
      y,
      distance,
      travel,
      radius: pointRadius * 0.85,
      opacity,
      color: `rgb(${color.join(',')})`,
    }
  })
  return (width: number, height: number, cameraY = 0) => {
    const focal = Math.max(width, height) / 2
    const points: { x: number; y: number; radius: number; opacity: number; color: string }[] = []
    for (const star of stars) {
      if (star.distance <= 100) continue
      const worldY = star.y - cameraY * star.travel
      const length = Math.hypot(star.x, worldY)
      const angular = Math.atan(length / star.distance)
      const x = (star.x / Math.max(0.001, length)) * angular * focal + width / 2
      const y = (worldY / Math.max(0.001, length)) * angular * focal + height * 0.43
      if (x < -8 || x > width + 8 || y < -8 || y > height + 8) continue
      points.push({ x, y, radius: star.radius, opacity: star.opacity, color: star.color })
    }
    return points
  }
}
