'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

/**
 * The orbital sphere — the wireframe atom that rises into the Home hero, sits
 * behind the closing CTA band, and draws as line art on the bone bands.
 *
 * **This is the official export, ported.** It supersedes the hand-traced
 * reconstruction that stood here before: the design file only ever carried this
 * globe as a flattened raster — one a blurred crop under a scrim, one a video
 * capture with a mouse cursor in it — so the trace was a reading of poor
 * evidence. The export is the drawing itself, and it carries the live tweak
 * settings as configuration. Archived under `apps/storybook/prototypes/`.
 *
 * **Two readings from the trace survive, because the export has no opinion on
 * how the globe meets this site's bands.**
 *
 * It presents as a *lit rim, not a filled disc*. Sampled down the hero raster's
 * centre column the band sits at `#121010`, the limb peaks at `#5D221A` over
 * about 40px, and 100px inside the limb it is back to `#190E0E`. A treatment
 * that ramps from the centre floods the hero and buries the headline.
 *
 * And the Home opener's ratio *does not carry to the narrow frame*: that band is
 * a third the width but nearly the same height (874 against 940), so the
 * proportion the eye reads is the cap's height against the band's, not the
 * sphere's width against the frame's.
 *
 * **Geometry is seeded and shared.** Every preset draws the same atom from seed
 * 1837 — identical orbit layout on every render, which is what lets this
 * component server-render without a hydration mismatch and what keeps `pnpm vr`
 * stable. The seed is not a tuning knob.
 */
export interface OrbitalSphereProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * The colour treatment. One axis, because that is all the exports differ by —
   * geometry, seed, motion and orbit count are identical between them.
   *
   * - `hero` — brand red with the outer bloom. The red export's own settings.
   * - `background` — neutral grey, a softer bloom. The grey export calls itself
   *   the background globe.
   * - `line` — **fine dark line art on bone, no bloom and no halos.** Derived
   *   from the grey export rather than drawn separately, so the bone bands show
   *   the same atom the dark bands do.
   */
  preset?: GlobePreset
  /**
   * Whether the sphere turns.
   *
   * Defaults to `still` so a decorative background never moves by accident; a
   * band that wants motion asks for it. `prefers-reduced-motion` stops the
   * whole animation — the turn, the electrons and the pulse — not just the
   * stylesheet's half of it.
   */
  motion?: 'still' | 'orbit'
}

export type GlobePreset = 'hero' | 'background' | 'line'

/**
 * The export's `CONFIG`, split into what every preset shares and what each one
 * overrides. The shared half is transcribed from the exports and is not ours to
 * tune; the colour half is the only thing the two exports disagreed about.
 */
const GEOMETRY = {
  tilt: 11,
  angle: -17,
  lines: 7,
  lineWidth: 1.3,
  lineOpacity: 1.15,
  randomness: 0.2,
  speed: 0.3,
  seed: 1837,
  mouseFollow: 0.8,
  balls: 3,
  electronR: 7,
} as const

interface Palette {
  glow: number
  /** Blur radius on the electrons. Zero collapses the filters to nothing. */
  electronGlow: number
  electronOpacity: number
  accent: string
  accentDim: string
  wire: string
  dotCols: readonly string[]
  glowCols: readonly [string, string, string]
  shade: readonly [string, string]
  /** Multiplies every stroke opacity. Ink-on-bone needs more than white-on-ink. */
  strokeScale: number
  /** The faint radial over the sphere's interior. Zero on bone, where it washes. */
  shadeOpacity: number
  /**
   * The whole field's opacity. The exports ship at full so they read as
   * complete assets; the site's own treatment is in the export README, and it
   * dims the background globe hard.
   */
  opacity: number
}

/**
 * Brand-bearing colours resolve through token roles — both apps render this
 * package, so a literal red here would paint O3's brand on an O3XO page. The
 * neutral greys stay literal: they are not a brand fact and no shared role
 * carries them.
 */
const PALETTES: Record<GlobePreset, Palette> = {
  hero: {
    glow: 1.4,
    electronGlow: 3,
    electronOpacity: 1,
    /*
     * Every red here is the brand role or a `color-mix` off it — the export's
     * own values are O3-red derivatives (`#b03a2e`, `#7e140a`, `#ff5a40`), and
     * both apps render this package, so a literal would draw O3's brand on an
     * O3XO hero. `brand-token-seam.test.ts` cannot catch that: it flags roles
     * only one token package declares, and a raw hex declares nothing.
     *
     * The mixes reproduce the export's ramp against `--color-brand`: the dim
     * arc and the mid bloom sit toward black, the hot inner ring toward white.
     */
    accent: 'var(--color-brand)',
    accentDim: 'color-mix(in srgb, var(--color-brand) 62%, black)',
    wire: '#e9edf5',
    dotCols: [
      'var(--color-brand)',
      'color-mix(in srgb, var(--color-brand) 62%, black)',
      '#c8c8cc',
      '#8a8a8e',
    ],
    glowCols: [
      'var(--color-brand)',
      'color-mix(in srgb, var(--color-brand) 45%, black)',
      'color-mix(in srgb, var(--color-brand) 70%, white)',
    ],
    shade: ['var(--color-brand)', 'color-mix(in srgb, var(--color-brand) 45%, black)'],
    strokeScale: 1,
    shadeOpacity: 1,
    opacity: 1,
  },
  background: {
    glow: 0.6,
    electronGlow: 3,
    electronOpacity: 1,
    accent: '#c8c8cc',
    accentDim: '#8a8a8e',
    wire: '#e9edf5',
    dotCols: ['#e9edf5', '#c8c8cc', '#8a8a8e', '#6e6e73'],
    glowCols: ['#c8c8cc', '#4a4a4e', '#f4f4f6'],
    shade: ['#c8c8cc', '#4a4a4e'],
    strokeScale: 1,
    shadeOpacity: 1,
    /* The export README's live value: the site runs the background globe at
       0.15. The export ships at full only so it reads as a complete asset. */
    opacity: 0.15,
  },
  /*
   * Bone. `glow: 0` emits none of the three blurred bloom rings — the generator
   * guards them on that value. `electronGlow: 0` is the less obvious half: the
   * electron blur filters are attached structurally, independent of `glow`, and
   * a blurred dark dot on bone reads as a smudge where the same construction on
   * near-black reads as a glow. Zero collapses them.
   *
   * `strokeScale` is the eyeball value. The export's opacities were set for
   * light strokes on near-black and land thin as ink on bone; the front-to-back
   * depth cue is a ratio and survives the inversion untouched.
   */
  line: {
    glow: 0,
    electronGlow: 0,
    electronOpacity: 0.55,
    accent: 'var(--color-ink)',
    accentDim: 'var(--color-ink)',
    wire: 'var(--color-ink)',
    dotCols: ['var(--color-ink)'],
    glowCols: ['transparent', 'transparent', 'transparent'],
    shade: ['transparent', 'transparent'],
    strokeScale: 0.42,
    shadeOpacity: 0,
    opacity: 1,
  },
}

/**
 * Both layers carry the export's tilt and spin, and the preset's opacity. They
 * are stacked exactly on top of each other, so anything that moves one and not
 * the other pulls the drawing apart.
 */
const LAYER_STYLE = (opacity: number) => ({
  transform: `rotateX(${GEOMETRY.tilt}deg) rotate(${GEOMETRY.angle}deg)`,
  transformOrigin: '50% 50%' as const,
  opacity,
})

/** The export's projection constants. */
const C = 600
const R = 340
const FL = 1650
/** Points sampled per great circle. */
const SEGMENTS = 72

interface Dot {
  t: number
  sp: number
  r: number
  col: string
  glow: boolean
}

interface Arc {
  u: [number, number, number]
  v: [number, number, number]
  col: string
  op: number
  w: number
  dots: Dot[]
  colored: boolean
  i: number
}

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
function buildArcs(palette: Palette): Arc[] {
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

const AXIS = norm3([0.32, 1, 0.18])

const rotateAbout = (
  p: [number, number, number],
  cs: number,
  sn: number,
): [number, number, number] => {
  const dd = AXIS[0] * p[0] + AXIS[1] * p[1] + AXIS[2] * p[2]
  const cr = cross(AXIS, p)
  return [
    p[0] * cs + cr[0] * sn + AXIS[0] * dd * (1 - cs),
    p[1] * cs + cr[1] * sn + AXIS[1] * dd * (1 - cs),
    p[2] * cs + cr[2] * sn + AXIS[2] * dd * (1 - cs),
  ]
}

/** The export's perspective projection, with the mouse tilt folded in. */
function makeProjector(al: number, be: number) {
  const ca = Math.cos(al)
  const sa = Math.sin(al)
  const cb = Math.cos(be)
  const sb = Math.sin(be)
  return (p: [number, number, number]) => {
    const x = p[0] * ca + p[2] * sa
    let z = -p[0] * sa + p[2] * ca
    const y2 = p[1] * cb - z * sb
    z = p[1] * sb + z * cb
    const kk = FL / (FL - z)
    return [C + x * kk, C + y2 * kk, z] as const
  }
}

const onCircle = (arc: Arc, ct: number, st: number): [number, number, number] => [
  (arc.u[0] * ct + arc.v[0] * st) * R,
  (arc.u[1] * ct + arc.v[1] * st) * R,
  (arc.u[2] * ct + arc.v[2] * st) * R,
]

/**
 * One great circle, split into the half facing the viewer and the half behind.
 * Drawn at render time for the still frame and re-driven per frame by the loop,
 * so a `still` globe and a server-rendered one show the same complete atom
 * rather than an empty limb.
 */
function arcPaths(
  arc: Arc,
  cs: number,
  sn: number,
  project: ReturnType<typeof makeProjector>,
): { back: string; front: string } {
  let back = ''
  let front = ''
  let penB = false
  let penF = false
  for (let m = 0; m <= SEGMENTS; m++) {
    const a = (m / SEGMENTS) * Math.PI * 2
    const q = project(rotateAbout(onCircle(arc, Math.cos(a), Math.sin(a)), cs, sn))
    const pt = `${q[0].toFixed(1)} ${q[1].toFixed(1)}`
    if (q[2] >= 0) {
      front += `${penF ? ' L ' : ' M '}${pt}`
      penF = true
      penB = false
    } else {
      back += `${penB ? ' L ' : ' M '}${pt}`
      penB = true
      penF = false
    }
  }
  return { back: back || 'M 0 0', front: front || 'M 0 0' }
}

/** Where a dot sits at phase `t`, and how bright it is from there. */
function dotAt(
  arc: Arc,
  d: Dot,
  t: number,
  cs: number,
  sn: number,
  project: ReturnType<typeof makeProjector>,
  electronOpacity: number,
) {
  const q = project(rotateAbout(onCircle(arc, Math.cos(t), Math.sin(t)), cs, sn))
  const kk = FL / (FL - q[2])
  return {
    cx: q[0].toFixed(1),
    cy: q[1].toFixed(1),
    r: Math.max(0.4, d.r * kk).toFixed(1),
    opacity: (q[2] >= 0 ? Math.min(1, d.glow ? electronOpacity : arc.op + 0.35) : 0.22).toFixed(2),
  }
}

export function OrbitalSphere({
  preset = 'hero',
  motion = 'still',
  className,
  ...rest
}: OrbitalSphereProps) {
  const palette = PALETTES[preset]
  const arcs = useMemo(() => buildArcs(palette), [palette])

  /*
   * The still frame, computed in render rather than by the effect. This is what
   * a `motion="still"` globe shows, what the server sends, and what a viewer
   * with JavaScript off or reduced motion on keeps looking at. Without it the
   * paths carry no `d` until the loop's first tick, which draws the limb and
   * the bloom and none of the orbits.
   */
  const still = useMemo(() => {
    const project = makeProjector(0, 0)
    return arcs.map((arc) => ({
      paths: arcPaths(arc, 1, 0, project),
      dots: arc.dots.map((d) => dotAt(arc, d, d.t, 1, 0, project, palette.electronOpacity)),
    }))
  }, [arcs, palette])

  const hostRef = useRef<HTMLDivElement>(null)
  const backRefs = useRef<(SVGPathElement | null)[]>([])
  const frontRefs = useRef<(SVGPathElement | null)[]>([])
  const dotRefs = useRef<(SVGCircleElement | null)[][]>([])

  const turning = motion === 'orbit'

  useEffect(() => {
    if (!turning) return
    const host = hostRef.current
    if (!host) return

    /*
     * The export honours `prefers-reduced-motion` in its stylesheet only, which
     * stops the pulse and leaves the sphere turning. The loop is the louder half
     * — so it is gated here, before anything is scheduled.
     */
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) return

    /* Mutable copies: the render-time descriptors stay pure across re-renders. */
    const phases = arcs.map((a) => a.dots.map((d) => d.t))

    let mx = 0
    let my = 0
    let smoothX = 0
    let smoothY = 0
    const onMove = (e: MouseEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2
      my = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    /*
     * A globe scrolled out of view stops costing frames. It is a decoration on
     * long pages and there is often more than one of them.
     */
    let visible = true
    const io = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true
    })
    io.observe(host)

    const omega = (2 * Math.PI) / (70 / GEOMETRY.speed)
    const t0 = performance.now()
    let raf = 0

    /*
     * Half rate. The sphere completes one revolution every 233 seconds, so a
     * frame at 60Hz advances any point by a fraction of a pixel — the extra
     * thirty frames buy nothing anyone can see and cost a full pass of path
     * rebuilding and attribute writes. The electrons are the fastest thing here
     * and they still move well under a pixel per frame at 30.
     */
    const MIN_FRAME_MS = 1000 / 30
    let painted = -Infinity

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return
      /* A degree of slack, or a display running just under 60Hz drops to 15. */
      if (now - painted < MIN_FRAME_MS - 2) return
      painted = now

      const t = (now - t0) / 1000
      const cs = Math.cos(t * omega)
      const sn = Math.sin(t * omega)
      smoothX += (mx - smoothX) * 0.06
      smoothY += (my - smoothY) * 0.06
      const project = makeProjector(
        smoothX * 0.55 * GEOMETRY.mouseFollow,
        smoothY * 0.4 * GEOMETRY.mouseFollow,
      )

      arcs.forEach((arc, ci) => {
        const { back, front } = arcPaths(arc, cs, sn, project)
        backRefs.current[ci]?.setAttribute('d', back)
        frontRefs.current[ci]?.setAttribute('d', front)

        const phaseRow = phases[ci]
        if (!phaseRow) return
        arc.dots.forEach((d, k) => {
          const el = dotRefs.current[ci]?.[k]
          if (!el) return
          phaseRow[k] = (phaseRow[k] ?? 0) + (d.sp * GEOMETRY.speed) / 60
          const at = dotAt(arc, d, phaseRow[k]!, cs, sn, project, palette.electronOpacity)
          el.setAttribute('cx', at.cx)
          el.setAttribute('cy', at.cy)
          el.setAttribute('r', at.r)
          el.setAttribute('opacity', at.opacity)
        })
      })
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      io.disconnect()
    }
  }, [arcs, palette, turning])

  /*
   * `useId` is deliberately not used for the filter ids. The blur radii are the
   * only thing they carry and they are identical for every instance of a preset,
   * so sharing one definition across instances is correct rather than a
   * collision — and it keeps the markup stable for the visual regression run.
   */
  const filterId = (n: number) => `globe-${preset}-blur-${n}`
  const blurs = [
    Math.max(0.1, palette.electronGlow * (1 - 0.6 * GEOMETRY.randomness)),
    Math.max(0.1, palette.electronGlow),
    Math.max(0.1, palette.electronGlow * (1 + 0.8 * GEOMETRY.randomness)),
  ]

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute aspect-square', className)}
      {...rest}
    >
      {/*
       * THE MOVING HALF. Nothing but the great circles and their electrons —
       * hairline strokes, cheap to repaint at whatever rate the loop asks for.
       *
       * The split from the static half below is the whole performance story of
       * this component. The bloom is three Gaussian-blurred rings, and the SVG
       * scales user units by the call site's width: on the Home hero, which
       * renders about 2670px across, `blur(60px)` becomes a **236px** blur in
       * CSS pixels — 472 device pixels at DPR 2 — over a surface that size.
       * While it shared an `<svg>` with the arcs, every path write invalidated
       * it and the browser re-rasterised all three rings sixty times a second.
       * They never change. Now they are a sibling that paints once.
       */}
      <svg
        /*
         * The export draws on 1200 square with the sphere at r=340 about the
         * centre — a sphere occupying 56.7% of its box, the rest reserved for
         * bloom. Framed here to the sphere itself (600±340) instead, so the box
         * IS the sphere and a call site's `w-[…vw]` means what its derivation
         * says it means: the sphere as a fraction of the viewport.
         *
         * `overflow: visible` is load-bearing rather than defensive: the
         * perspective divide magnifies the near half of each great circle by up
         * to 1.26, so arcs genuinely reach past the box. That is also why this
         * layer cannot take `contain: paint` — it would clip them.
         */
        viewBox="260 260 680 680"
        className="absolute inset-0 h-full w-full overflow-visible"
        style={LAYER_STYLE(palette.opacity)}
      >
        <defs>
          {blurs.map((sd, n) => (
            <filter key={n} id={filterId(n)} x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation={sd.toFixed(1)} result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          ))}
        </defs>

        {arcs.map((arc, ci) => (
          <g
            key={arc.i}
            /*
             * Only the coloured arcs breathe, and only when the band asked for
             * motion. Period and stagger come straight off the export's own
             * formula — `(4.2 + i * 0.7) / speed` seconds, `i * 1.1` in — which
             * at `speed: 0.3` is 18.7s and 28s for the two arcs this draws.
             * Two periods that divide neither each other nor the turn, so the
             * field never visibly repeats.
             */
            className={turning && arc.colored ? 'motion-reduce:animate-none' : undefined}
            style={
              turning && arc.colored
                ? {
                    /* The keyframe dips to 45% of this, the way the export's
                       `--po` does. The arcs carry their own stroke opacity, so
                       the group's peak is 1. */
                    ['--po' as string]: 1,
                    animation: `globe-pulse ${((4.2 + arc.i * 0.7) / GEOMETRY.speed).toFixed(1)}s ease-in-out ${(arc.i * 1.1).toFixed(1)}s infinite`,
                  }
                : undefined
            }
          >
            <path
              ref={(el) => {
                backRefs.current[ci] = el
              }}
              d={still[ci]?.paths.back}
              fill="none"
              stroke={arc.col}
              strokeWidth={arc.w.toFixed(2)}
              strokeOpacity={(arc.op * 0.28).toFixed(2)}
            />
            <path
              ref={(el) => {
                frontRefs.current[ci] = el
              }}
              d={still[ci]?.paths.front}
              fill="none"
              stroke={arc.col}
              strokeWidth={arc.w.toFixed(2)}
              strokeOpacity={arc.op.toFixed(2)}
            />
            {arc.dots.map((d, k) => (
              <circle
                key={k}
                ref={(el) => {
                  dotRefs.current[ci] ??= []
                  dotRefs.current[ci]![k] = el
                }}
                cx={still[ci]?.dots[k]?.cx}
                cy={still[ci]?.dots[k]?.cy}
                r={still[ci]?.dots[k]?.r ?? d.r.toFixed(1)}
                opacity={still[ci]?.dots[k]?.opacity}
                fill={d.col}
                filter={d.glow && palette.electronGlow > 0 ? `url(#${filterId(k % 3)})` : undefined}
              />
            ))}
          </g>
        ))}
      </svg>

      {/*
       * THE STILL HALF — the bloom, the limb and the interior wash. None of it
       * is a function of time, so it is lifted out of the layer that rewrites
       * itself every frame and rasterised once.
       *
       * Paint order is preserved exactly: in the export these three sit ON TOP
       * of the arcs, so this sibling comes after the animated one in the DOM
       * and inherits the same transform. Concentric circles are invariant under
       * the Z rotation, but `rotateX` squashes them, so the transform has to
       * match rather than be dropped.
       */}
      <svg
        viewBox="260 260 680 680"
        className="absolute inset-0 h-full w-full overflow-visible"
        style={LAYER_STYLE(palette.opacity)}
      >
        <defs>
          <radialGradient id={`globe-${preset}-shade`} cx="38%" cy="32%" r="75%">
            <stop
              offset="0%"
              stopColor={palette.shade[0]}
              stopOpacity={0.1 * palette.shadeOpacity}
            />
            <stop
              offset="55%"
              stopColor={palette.shade[1]}
              stopOpacity={0.05 * palette.shadeOpacity}
            />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/*
         * The bloom — three blurred rings just outside the limb, which is what
         * makes this a lit rim rather than a filled disc. `glow: 0` emits none
         * of them, which is how the bone bands stay unlit.
         */}
        {palette.glow > 0 ? (
          <>
            <circle
              cx={C}
              cy={C}
              r={R + 6}
              fill="none"
              stroke={palette.glowCols[0]}
              strokeWidth="14"
              style={{ filter: 'blur(26px)', opacity: 0.5 * palette.glow }}
            />
            <circle
              cx={C}
              cy={C}
              r={R + 22}
              fill="none"
              stroke={palette.glowCols[1]}
              strokeWidth="44"
              style={{ filter: 'blur(60px)', opacity: 0.4 * palette.glow }}
            />
            <circle
              cx={C}
              cy={C}
              r={R + 2}
              fill="none"
              stroke={palette.glowCols[2]}
              strokeWidth="3"
              style={{ filter: 'blur(8px)', opacity: 0.45 * palette.glow }}
            />
          </>
        ) : null}

        {/* The limb itself. */}
        <circle
          cx={C}
          cy={C}
          r={R}
          fill="none"
          stroke={palette.wire}
          strokeWidth={(1.1 * GEOMETRY.lineWidth).toFixed(2)}
          strokeOpacity={Math.min(
            1,
            Math.max(0.15, 0.5 * GEOMETRY.lineOpacity * palette.strokeScale),
          ).toFixed(2)}
        />
        {palette.shadeOpacity > 0 ? (
          <circle cx={C} cy={C} r={R} fill={`url(#globe-${preset}-shade)`} />
        ) : null}
      </svg>
    </div>
  )
}
