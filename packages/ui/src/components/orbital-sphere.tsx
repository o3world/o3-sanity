import type { HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

/**
 * The orbital sphere — the wireframe globe with a brand-red lit limb that
 * rises into the Home hero (`1810:1616`) and sits behind the closing CTA band
 * (`1799:1470`).
 *
 * **Why this is drawn rather than exported.** Both frames carry it as a
 * flattened raster: the hero's (`1810:1588`) has the NavBar and the entire
 * headline baked into the pixels, and the CTA band's (`1680:2085`) is a video
 * capture with a **mouse cursor** in the middle of it. Neither is shippable,
 * and neither scales past its capture width. So the geometry is rebuilt here
 * from the frames — a limb, four great circles, and node dots on the paths —
 * which also gives #33's open motion question something it can animate, which
 * a JPEG could never be.
 *
 * **It is a lit rim, not a filled disc.** That is the one thing worth getting
 * right, and the easy thing to get wrong: sampled down the hero raster's
 * centre column, the band sits at `#121010`, the limb peaks at `#5D221A` over
 * a span of about 40px, and 100px inside the limb it is back to `#190E0E`.
 * The sphere's interior is barely warmer than the band around it. A radial
 * that ramps from the centre — the obvious first draft — floods the hero red
 * and buries the headline.
 *
 * Geometry is read the same way. Solving a circle through the limb's apex on
 * the centre column (`720, 650`) and its crossing at quarter-width
 * (`360, 775`) gives **r ≈ 581 centred at (720, 1231)** on the 892-tall band:
 * a sphere 80.7% of the frame width, hung so only its cap shows. Sized in
 * `vw` here so that ratio holds at any viewport.
 *
 * The colour vocabulary is read, not invented: the rim resolves to brand
 * `#EB1000` lightened by the bloom, and the arcs are white at the same `0.2`
 * the footer's orbital stroke uses (`--color-on-ink-line`).
 */
export interface OrbitalSphereProps extends HTMLAttributes<HTMLDivElement> {
  /** Dim the whole field. The CTA band runs it quieter than the hero. */
  intensity?: 'full' | 'soft'
  /**
   * Which band it sits on.
   *
   * - `ink` — white arcs over the red bloom. The hero and the CTA band.
   * - `light` — **fine dark line-art, no bloom.** The pull quote (`1683:2139`,
   *   `1683:2655`) and the About hero draw the same sphere as a hairline
   *   drawing on bone: the glow belongs to the dark bands only.
   */
  tone?: 'ink' | 'light'
}

export function OrbitalSphere({
  intensity = 'full',
  tone = 'ink',
  className,
  ...rest
}: OrbitalSphereProps) {
  const soft = intensity === 'soft'
  const light = tone === 'light'

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute aspect-square', className)}
      {...rest}
    >
      {/*
       * The bloom. Its box overhangs the sphere so the glow can fall off
       * OUTSIDE the limb as well as inside it — the raster carries about 75px
       * of warm falloff above the apex, which on r ≈ 581 is the 6.5% inset
       * below and puts the limb itself at 88.5% of the bloom's radius.
       * `closest-side` keeps the stops circular whatever the box does.
       */}
      {light ? null : (
        <div
          className="absolute inset-[-6.5%] rounded-full"
          style={{
            background:
              'radial-gradient(closest-side circle at 50% 50%, rgba(120, 22, 14, 0) 0%, rgba(120, 22, 14, 0.16) 60%, rgba(150, 45, 30, 0.5) 82%, rgba(166, 52, 34, 0.62) 88.5%, rgba(140, 34, 22, 0.25) 94%, rgba(140, 34, 22, 0) 100%)',
            opacity: soft ? 0.75 : 1,
          }}
        />
      )}

      <svg viewBox="0 0 1000 1000" fill="none" className="absolute inset-0 h-full w-full">
        <g
          className={light ? 'stroke-ink' : 'stroke-on-ink-line'}
          strokeWidth={light ? 1 : 1.4}
          opacity={light ? 0.45 : soft ? 0.7 : 1}
        >
          {/* The limb. */}
          <circle cx="500" cy="500" r="498" />
          {/* Latitudes — flattened ellipses, tipped with the pole. */}
          <ellipse cx="500" cy="500" rx="498" ry="170" transform="rotate(-9 500 500)" />
          <ellipse cx="500" cy="500" rx="498" ry="340" transform="rotate(-9 500 500)" />
          {/* Longitudes. */}
          <ellipse cx="500" cy="500" rx="152" ry="498" transform="rotate(14 500 500)" />
          <ellipse cx="500" cy="500" rx="334" ry="498" transform="rotate(-26 500 500)" />
        </g>

        {/* The two arcs the ink frames pick out in red; on bone they stay grey. */}
        <g
          className={light ? 'stroke-ink' : undefined}
          stroke={light ? undefined : '#eb1000'}
          strokeWidth={light ? 1 : 1.6}
          opacity={light ? 0.45 : soft ? 0.28 : 0.4}
        >
          <ellipse cx="500" cy="500" rx="445" ry="498" transform="rotate(38 500 500)" />
          <ellipse cx="500" cy="500" rx="498" ry="255" transform="rotate(-9 500 500)" />
        </g>

        {/* Node dots — the frames scatter a handful along the paths. */}
        <g className={light ? 'fill-ink' : 'fill-white'} opacity={light ? 0.55 : soft ? 0.35 : 0.5}>
          <circle cx="146" cy="286" r="5" />
          <circle cx="742" cy="196" r="4" />
          <circle cx="905" cy="612" r="4.5" />
          <circle cx="392" cy="742" r="4" />
        </g>
        <g
          className={light ? 'fill-ink' : undefined}
          fill={light ? undefined : '#eb1000'}
          opacity={light ? 0.55 : soft ? 0.4 : 0.65}
        >
          <circle cx="252" cy="168" r="4" />
          <circle cx="828" cy="392" r="3.5" />
          <circle cx="466" cy="906" r="4" />
        </g>
      </svg>
    </div>
  )
}
