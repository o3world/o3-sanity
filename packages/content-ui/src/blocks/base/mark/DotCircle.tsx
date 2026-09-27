import { useId, type CSSProperties, type ReactNode } from 'react'
import type { DotCircleIcon } from '@o3/sanity/constants'
import { cn } from '@o3/ui'

import { dotCircleArtwork } from './dotCircleArtwork'
import './dot-circle.css'

type Point = readonly [number, number]

export interface DotCircleProps {
  icon?: DotCircleIcon
  className?: string
}

/** Where a ripple starts: the heart's middle, the key's tip. Dots within 26px move. */
const RIPPLE_FROM: Partial<Record<DotCircleIcon, Point>> = { heart: [33, 35], key: [57, 33] }
const RIPPLE_REACH = 26
/** The three pods the squad's dots gather toward; the nearer a dot, the further it moves. */
const PODS: readonly Point[] = [
  [22, 25],
  [44, 25],
  [33, 46],
]
/** The network's four diagonal routes from the centre node: three link cells, then the far node's centre. */
const ROUTES: readonly (readonly Point[])[] = [
  [
    [25, 25],
    [21, 21],
    [17, 17],
    [9, 9],
  ],
  [
    [41, 25],
    [45, 21],
    [49, 17],
    [57, 9],
  ],
  [
    [25, 41],
    [21, 45],
    [17, 49],
    [9, 57],
  ],
  [
    [41, 41],
    [45, 45],
    [49, 49],
    [57, 57],
  ],
]
/** How many dots the team takes in from past the edge, and how far out they start. */
const NEWCOMERS = 12
const ARRIVAL_RADIUS = 46
/** The arrow wraps across the full grid: 17 cells of 4px. */
const GRID_SPAN = 68

type Vars = CSSProperties & Record<`--${string}`, string | number>

const distance = ([x, y]: Point, [fx, fy]: Point) => Math.hypot(x - fx, y - fy)
const dot = ([x, y]: Point, props?: { className?: string; style?: Vars }) => (
  <circle key={`${x},${y}`} cx={x} cy={y} r={1} {...props} />
)
const cell = ([x, y]: Point) => <rect key={`${x},${y}`} x={x} y={y} width={4} height={4} />

/**
 * The Figma Dot Circle (`figma-current-why-*`, `figma-current-engagement-*`):
 * whole dots on a 4px grid with a pictogram cut out, drawn on the server and
 * moved entirely by CSS. Its rest state is the Figma artwork; every animation
 * only adds movement, so reduced motion and the site's still mode simply turn
 * the animations off. Colour is `currentColor`, so the band decides ink or white.
 */
export function DotCircle({ icon = 'arrow', className }: DotCircleProps) {
  const mask = useId()
  const { dots, knockouts, beat } = dotCircleArtwork(icon)

  const rippleFrom = RIPPLE_FROM[icon]
  const newcomers =
    icon === 'team'
      ? dots
          .filter((point) => distance(point, [33, 33]) < 27)
          .filter((_, i, near) => i % Math.floor(near.length / NEWCOMERS) === 3)
          .slice(0, NEWCOMERS)
      : []

  let drawn: ReactNode
  if (rippleFrom) {
    const bands = new Map<number, Point[]>()
    const still: Point[] = []
    for (const point of dots) {
      const reach = distance(point, rippleFrom)
      if (reach >= RIPPLE_REACH) still.push(point)
      else {
        const band = Math.floor(reach / 4)
        bands.set(band, [...(bands.get(band) ?? []), point])
      }
    }
    drawn = (
      <>
        {still.map((point) => dot(point))}
        {[...bands].map(([band, points]) => (
          <g
            key={band}
            className="dc-band"
            style={
              {
                transformOrigin: `${rippleFrom[0]}px ${rippleFrom[1]}px`,
                '--band': band,
                '--swell': 1 + 1.2 / ((band + 1) * 4),
              } as Vars
            }
          >
            {points.map((point) => dot(point))}
          </g>
        ))}
      </>
    )
  } else if (icon === 'squad') {
    const nearest = (point: Point) =>
      PODS.reduce((best, pod) => (distance(point, pod) < distance(point, best) ? pod : best))
    drawn = dots.map((point) => {
      const pod = nearest(point)
      const pull = 0.62 * Math.exp(-distance(point, pod) / 20)
      return dot(point, {
        className: 'dc-gather',
        style: {
          '--to-x': `${((pod[0] - point[0]) * pull).toFixed(2)}px`,
          '--to-y': `${((pod[1] - point[1]) * pull).toFixed(2)}px`,
        },
      })
    })
  } else {
    drawn = dots.map((point) => {
      const n = newcomers.indexOf(point)
      if (n < 0) return dot(point)
      const reach = distance(point, [33, 33]) || 1
      const push = (ARRIVAL_RADIUS - reach) / reach
      return dot(point, {
        className: 'dc-join',
        style: {
          '--n': n,
          '--from-x': `${((point[0] - 33) * push).toFixed(1)}px`,
          '--from-y': `${((point[1] - 33) * push).toFixed(1)}px`,
        },
      })
    })
  }

  return (
    <svg
      viewBox="0 0 66 66"
      aria-hidden="true"
      focusable="false"
      data-dot-circle={icon}
      className={cn('dot-circle aspect-square shrink-0', className)}
    >
      <defs>
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="66" height="66">
          <circle cx={33} cy={33} r={33} fill="#fff" />
          <g
            className={icon === 'arrow' ? 'dc-march' : icon === 'key' ? 'dc-insert' : undefined}
            fill="#000"
          >
            {knockouts.map(cell)}
            {icon === 'arrow' && knockouts.map(([x, y]) => cell([x - GRID_SPAN, y]))}
          </g>
          {beat.length > 0 && (
            <g className="dc-beat" fill="#000">
              {beat.map(cell)}
            </g>
          )}
        </mask>
      </defs>
      <g mask={`url(#${mask})`} fill="currentColor">
        {drawn}
      </g>
      {icon === 'network' && (
        <g fill="var(--color-brand)">
          {ROUTES.map((route, r) =>
            [[33, 33] as const, ...route].map(([x, y], step) => (
              <circle
                key={`${r}-${step}`}
                cx={x}
                cy={y}
                r={1.3}
                className={step === route.length ? 'dc-arrive' : 'dc-hop'}
                style={{ '--route': r, '--step': step } as Vars}
              />
            )),
          )}
        </g>
      )}
    </svg>
  )
}
