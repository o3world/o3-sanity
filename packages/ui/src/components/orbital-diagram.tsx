import type { ReactNode } from 'react'

import { cn } from '../lib/utils'

/**
 * Where the four disciplines sit, solved from `1928:6526` — the dashed net is
 * six straight paths between four points, so the geometry is those points and
 * nothing else.
 *
 * `place` and `measure` come from the label frames, which are all centred on
 * their node's x: `1928:6535` (240 wide at x 440.16 → centre 560), `1928:6545`
 * (250 at 43 → 168), `1928:6551` (250 at 827 → 952), `1928:6557` (280 at 420 →
 * 560). Only the apex sits above its node.
 */
const SLOTS = [
  /** Apex — the frame gives Strategy 64px and the room to say more (`1928:6536`). */
  { x: 560, y: 339.88, place: 'above', measure: 531, lead: true },
  /** Base ring, left (`1928:6544`). */
  { x: 168, y: 703.2, place: 'below', measure: 250, lead: false },
  /** Base ring, right (`1928:6550`). */
  { x: 952, y: 703.2, place: 'below', measure: 250, lead: false },
  /** Base ring, front — nearest the viewer, so it hangs lowest (`1928:6556`). */
  { x: 560, y: 796.96, place: 'below', measure: 280, lead: false },
] as const

const BOX_W = 1120
const BOX_H = 1172
const pct = (value: number, of: number) => `${(value / of) * 100}%`

/** The six dashed paths are every pair of the four nodes — a complete graph. */
const EDGES = SLOTS.flatMap((from, index) =>
  SLOTS.slice(index + 1).map((to) => ({ d: `M${from.x} ${from.y}L${to.x} ${to.y}` })),
)

export interface OrbitalDiagramItem {
  heading: string
  body?: ReactNode
}

export interface OrbitalDiagramProps {
  /** Four disciplines, in slot order: apex, then the base ring left → right → front. */
  items: OrbitalDiagramItem[]
  className?: string
}

/**
 * The Solutions centrepiece (`1928:6524`) — the four disciplines placed on a
 * tetrahedron of dotted edges, each marked by a brand-red node.
 *
 * **It is not the OrbitalSphere.** Both issues describe this as "the four
 * disciplines around a circle", which reads as `OrbitalSphere` (#55) plus
 * labels — and the export says otherwise. `1928:6526` is six straight
 * `<path>`s between four points, dashed white at 0.42, with no arc, ellipse or
 * limb anywhere in it. The sphere's great circles would have been a different
 * drawing wearing this one's description, so the geometry is rebuilt from the
 * export instead of the sphere being bent to fit.
 *
 * **Position comes from array order, never from the author.** Slot 0 is the
 * apex — the frame sets it at 64px with a 531px measure because it is the
 * discipline everything else hangs off — and slots 1–3 take the base ring.
 * That is the same rule `railPanelsSection` numbering follows: an editor
 * orders a list, they do not type coordinates.
 *
 * The diagram is a `lg`-and-up composition. 1120×1172 of absolutely-positioned
 * copy has no honest 402 form and no 402 frame to copy, so the block that
 * renders it falls back to its grid layout below `lg` (ADR 0006).
 */
export function OrbitalDiagram({ items, className }: OrbitalDiagramProps) {
  const placed = SLOTS.flatMap((slot, index) => {
    const item = items[index]
    return item ? [{ slot, item }] : []
  })

  return (
    <div
      className={cn('aspect-1120/1172 max-w-280 relative mx-auto w-full', className)}
      data-testid="orbital-diagram"
    >
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${BOX_W} ${BOX_H}`}
        fill="none"
        className="absolute inset-0 h-full w-full"
      >
        <g
          stroke="currentColor"
          strokeOpacity={0.42}
          strokeWidth={12.6}
          strokeLinecap="round"
          strokeDasharray="11.46 11.46"
        >
          {EDGES.map((edge) => (
            <path key={edge.d} d={edge.d} />
          ))}
        </g>
        <g className="fill-brand">
          {SLOTS.map((slot) => (
            <circle key={`${slot.x}-${slot.y}`} cx={slot.x} cy={slot.y} r={5.5} />
          ))}
        </g>
      </svg>

      {placed.map(({ slot, item }) => {
        const above = slot.place === 'above'
        return (
          <div
            key={item.heading}
            className={cn(
              'absolute flex -translate-x-1/2 flex-col items-center text-center',
              // The stack's bottom clears the apex node by ~60px; below the
              // ring its top starts ~59px under the node (`1928:6535` /
              // `1928:6543`). Same clearance, opposite direction.
              above ? '-translate-y-full gap-7' : 'gap-8',
            )}
            style={{
              left: pct(slot.x, BOX_W),
              top: pct(above ? slot.y - 59.63 : slot.y + 58.59, BOX_H),
              width: pct(slot.measure, BOX_W),
            }}
          >
            <p
              className={cn(
                'font-display text-balance text-white',
                slot.lead
                  ? 'text-hero font-medium tracking-[-0.0219em]'
                  : 'text-[clamp(30px,2.78vw,40px)] font-medium leading-[1.2] tracking-[-0.015em]',
              )}
            >
              {item.heading}
            </p>
            {item.body ? (
              <p
                className={cn(
                  'text-on-ink-subtle text-pretty',
                  slot.lead ? 'text-[18px] leading-[1.6]' : 'text-[15px] leading-[1.55]',
                )}
              >
                {item.body}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
