import type { HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

/**
 * The orbital sphere — the wireframe globe with a brand-red lit limb that
 * rises into the Home hero (`2089:4316`) and sits behind the closing CTA band
 * (`1799:1470`).
 *
 * **Why this is drawn rather than exported.** Both frames carry it as a
 * flattened raster: the hero's (`1866:2412`) is a blurred crop under a scrim,
 * standing in for an animation, and the CTA band's (`1680:2085`) is a video
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
 * Geometry is read the same way, off the redesigned Home hero's `Graphic`
 * (`1866:2412`) — the raster that stands in for this component there, 1926 ×
 * 400 seated on the band's foot. Tracing the crest of its lit limb across the
 * band gives **r ≈ 963 centred 640px below the foot**: a sphere **133.75% of
 * the frame width**, hung so only its cap shows, apex 323px up from the foot.
 * Sized in `vw` at the call site so that ratio holds at any viewport.
 *
 * The proportion to check, if it ever looks wrong, is the arc against the copy
 * above it: the frame's apex passes just under the CTA's foot, so the limb
 * runs nearly flat across the band rather than doming up into the headline.
 *
 * The colour vocabulary is read, not invented: the coloured arcs and node dots
 * are `--color-brand`, the bloom is `--gradient-sphere-bloom` (the sampled
 * falloff around the limb, and the token that carries this component's brand
 * red for both brands), and the wireframe is white at the same `0.2` the
 * footer's orbital stroke uses (`--color-on-ink-line`).
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
  /**
   * Whether the sphere turns — the motion question this component was drawn
   * rather than exported to be able to answer (#33).
   *
   * - `still` — one instant of it, which is all the frames ever showed.
   * - `orbit` — the wireframe turns once a minute and the two coloured great
   *   circles breathe against it, carried from the prototype's `.orb-all` /
   *   `orbPulse` (periods and stagger are tokens in motion.css).
   *
   * Defaults to `still` so a decorative background never moves by accident;
   * a band that wants the motion asks for it. `motion-reduce` stops all three
   * loops regardless — a background that turns forever is exactly what that
   * preference is about.
   */
  motion?: 'still' | 'orbit'
}

export function OrbitalSphere({
  intensity = 'full',
  tone = 'ink',
  motion = 'still',
  className,
  ...rest
}: OrbitalSphereProps) {
  const soft = intensity === 'soft'
  const light = tone === 'light'
  const turning = motion === 'orbit'

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute aspect-square', className)}
      {...rest}
    >
      {/*
       * The bloom. Its box overhangs the sphere by 6.5% so the glow can fall
       * off OUTSIDE the limb as well as inside it, the way the raster's does.
       * That inset is also what puts the limb at 88.5% of the bloom's radius,
       * which is where `--gradient-sphere-bloom` sets its brightest stop.
       */}
      {light ? null : (
        <div
          className="bg-(image:--gradient-sphere-bloom) absolute inset-[-6.5%] rounded-full"
          style={{ opacity: soft ? 0.75 : 1 }}
        />
      )}

      {/*
       * The turn is on the `<svg>` itself rather than an inner `<g>`: the
       * sphere is centred in a square box, so rotating the element about its
       * own centre is the same picture as rotating the drawing about (500,500)
       * — and it sidesteps SVG's `transform-box` rules entirely. The bloom sits
       * outside it and stays put, which costs nothing, being a radial.
       */}
      <svg
        viewBox="0 0 1000 1000"
        fill="none"
        className={cn(
          'absolute inset-0 h-full w-full',
          turning && 'animate-orbit origin-center motion-reduce:animate-none',
        )}
      >
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

        {/*
         * The two arcs the ink frames pick out in red; on bone they stay grey.
         *
         * One group per arc, because the prototype breathes them on their own
         * clocks — 4.2s from the start and 4.9s from 1.1s in. Only the coloured
         * pair pulses: on `light` these are hairline grey drawing, and the
         * prototype only ever pulsed what it had painted.
         */}
        {[
          { rx: 445, ry: 498, rotate: 38, animate: 'animate-orbit-pulse' },
          { rx: 498, ry: 255, rotate: -9, animate: 'animate-orbit-pulse-alt' },
        ].map((arc) => (
          <g
            key={arc.rotate}
            className={cn(
              light ? 'stroke-ink' : 'stroke-brand',
              turning && !light && `${arc.animate} motion-reduce:animate-none`,
            )}
            strokeWidth={light ? 1 : 1.6}
            opacity={light ? 0.45 : soft ? 0.28 : 0.4}
          >
            <ellipse
              cx="500"
              cy="500"
              rx={arc.rx}
              ry={arc.ry}
              transform={`rotate(${arc.rotate} 500 500)`}
            />
          </g>
        ))}

        {/* Node dots — the frames scatter a handful along the paths. */}
        <g className={light ? 'fill-ink' : 'fill-white'} opacity={light ? 0.55 : soft ? 0.35 : 0.5}>
          <circle cx="146" cy="286" r="5" />
          <circle cx="742" cy="196" r="4" />
          <circle cx="905" cy="612" r="4.5" />
          <circle cx="392" cy="742" r="4" />
        </g>
        <g className={light ? 'fill-ink' : 'fill-brand'} opacity={light ? 0.55 : soft ? 0.4 : 0.65}>
          <circle cx="252" cy="168" r="4" />
          <circle cx="828" cy="392" r="3.5" />
          <circle cx="466" cy="906" r="4" />
        </g>
      </svg>
    </div>
  )
}
