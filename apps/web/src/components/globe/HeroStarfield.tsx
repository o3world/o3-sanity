import 'server-only'
import { starHash as hash } from './star-seed'

// A lightweight still sky for the first paint. The live scene remains vgpu-owned.
// Inline SVG avoids an image request and remains available if GPU startup fails.
const mix = (a: number, b: number, t: number) => a + (b - a) * t
const smooth = (a: number, b: number, value: number) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function firstPaintSky() {
  // Match starsShader's time-zero dome projection. Cover sizing plus a 50%/43%
  // background origin reproduces its max(width,height) focal length at any aspect ratio.
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
    const worldX = Math.cos(azimuth) * radial * radius
    const worldY = Math.sin(azimuth) * radial * radius
    const distance = 1650 + latitude * radius
    if (distance <= 100) return ''
    const length = Math.hypot(worldX, worldY)
    const angular = Math.atan(length / Math.max(100, distance))
    const x = (worldX / Math.max(0.001, length)) * angular * 720 + 720
    const y = (worldY / Math.max(0.001, length)) * angular * 720 + 619.2
    if (x < -8 || x > 1448 || y < -8 || y > 1448) return ''
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
      (backfield ? 0.72 : 1)
    const warmth = hash(n + 9)
    const color = [mix(0.88, 1, warmth), mix(0.92, 0.95, warmth), mix(1, 0.88, warmth)].map(
      (channel) => Math.round(mix(channel, 1, 0.375) * 255),
    )
    return `<path d="M${x.toFixed(3)} ${y.toFixed(3)}h.001" stroke="rgb(${color.join(',')})" stroke-width="${(pointRadius * 1.7).toFixed(3)}" opacity="${opacity.toFixed(3)}" vector-effect="non-scaling-stroke"/>`
  }).join('')
  return encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1440" viewBox="0 0 1440 1440"><g fill="none" stroke-linecap="round">${stars}</g></svg>`,
  )
}

const sky = firstPaintSky()

export function HeroStarfield() {
  return (
    <style>{`[data-spatial-layout] .hero-band:has(.hero-lead)::before { background-image: url("data:image/svg+xml,${sky}"); }`}</style>
  )
}
