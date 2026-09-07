import 'server-only'
import { starHash } from './star-seed'
import { createStartupSky } from './startup-sky'
import { startStartupSky } from './startup-sky-bootstrap'
import { readGlobeEntranceTiming, readSkyEntranceOffset } from './globe-entrance'

const paths = createStartupSky(starHash)(1440, 1440)
  .map(
    (point) =>
      `<path d="M${point.x.toFixed(3)} ${point.y.toFixed(3)}h.001" stroke="${point.color}" stroke-width="${(point.radius * 2).toFixed(3)}" opacity="${point.opacity.toFixed(3)}" vector-effect="non-scaling-stroke"/>`,
  )
  .join('')
const sky = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="1440" viewBox="0 0 1440 1440"><g fill="none" stroke-linecap="round">${paths}</g></svg>`,
)

// Like NavInkFirstPaint, this runs from server HTML rather than waiting for React.
const startup = `(${startStartupSky.toString()})(${[
  createStartupSky,
  starHash,
  readSkyEntranceOffset,
  readGlobeEntranceTiming,
]
  .map((fn) => fn.toString())
  .join(',')})`

export function HeroStarfield() {
  return (
    <style>{`[data-spatial-layout] .hero-band:has(.hero-lead)::before { background-image: url("data:image/svg+xml,${sky}"); }`}</style>
  )
}

/** Root-layout bootstrap: parsed once per document, never inserted by a route change. */
export function HeroStartup() {
  return <script dangerouslySetInnerHTML={{ __html: startup }} />
}
