import type { DotCircleIcon } from '@o3/sanity/constants'

type Point = readonly [number, number]

/**
 * The Figma Dot Circle, read off its six 66px exports: a 17×17 grid of r=1
 * dots on a 4px pitch, centred at 33, clipped to a circle of r=33, with a
 * pictogram filled over whole 4px cells.
 */
const SIZE = 66
const CENTRE = SIZE / 2
const PITCH = 4
const GRID = 17
const DOT_R = 1

/**
 * The pictograms, verbatim from the exports' `<path>` and `<rect>` data. Every
 * edge sits on a cell boundary (4k − 1), so a dot centre (4k + 1) is never on
 * one and the fill rule decides cleanly.
 */
const rect = (x: number, y: number) => `M${x} ${y}H${x + 4}V${y + 4}H${x}Z`
/** A network node: a 12px square with its centre cell left dotted (the exports' `Subtract` paths). */
const node = (x: number, y: number) =>
  `M${x + 6} ${y + 6}H${x - 6}V${y - 6}H${x + 6}Z` +
  `M${x - 2} ${y - 2}V${y + 2}H${x + 2}V${y - 2}H${x - 2}Z`

const PICTOGRAMS: Record<DotCircleIcon, readonly string[]> = {
  arrow: ['M39 47H35V39H15V27H35V19H39V23H43V27H47V31H51V35H47V39H43V43H39V47Z'],
  heart: [
    'M31 19V23H35V19H47V23H51V35H47V39H43V43H39V47H35V51H31V47H27V43H23V39H19V35H15V23H19V19H31Z',
  ],
  network: [
    ...[
      [33, 33],
      [57, 33],
      [9, 33],
      [33, 57],
      [57, 57],
      [9, 57],
      [33, 9],
      [57, 9],
      [9, 9],
    ].map(([x, y]) => node(x!, y!)),
    ...[
      [19, 19],
      [15, 15],
      [23, 23],
      [-1, 23],
      [-1, 39],
      [39, 15],
      [39, -1],
      [47, 23],
      [39, 39],
      [39, 63],
      [23, 63],
      [63, 39],
      [63, 23],
      [47, 47],
      [15, 39],
      [23, 15],
      [23, 47],
      [23, -1],
      [15, 23],
      [43, 19],
      [47, 15],
      [39, 23],
      [19, 43],
      [15, 47],
      [23, 39],
      [43, 43],
      [39, 47],
      [47, 39],
    ].map(([x, y]) => rect(x!, y!)),
  ],
  key: [
    'M55 31H59V35H55V39H51V35H47V43H43V35H38V39H34V35H31V39H27V43H15V39H11V23H15V19H27V23H31V27H55V31ZM23 27V23H19V27H15V35H19V39H23V35H27V27H23Z',
  ],
  squad: [],
  team: [],
}

/** Each subpath of an `M`/`H`/`V`/`Z` path as a polygon. */
function polygons(d: string): Point[][] {
  const shapes: Point[][] = []
  let x = 0
  let y = 0
  for (const [, cmd, arg] of d.matchAll(/([MHVZ])\s*([-\d.]+(?:\s+[-\d.]+)?)?/g)) {
    if (cmd === 'M') {
      ;[x, y] = arg!.split(/\s+/).map(Number) as [number, number]
      shapes.push([[x, y]])
    } else if (cmd === 'H') shapes.at(-1)!.push([(x = Number(arg)), y])
    else if (cmd === 'V') shapes.at(-1)!.push([x, (y = Number(arg))])
  }
  return shapes
}

/** Even-odd containment across a path's subpaths, which is how the exports cut their holes. */
function inside(d: string, [px, py]: Point): boolean {
  let crossings = 0
  for (const shape of polygons(d))
    for (let i = 0; i < shape.length; i++) {
      const [x1, y1] = shape[i]!
      const [x2, y2] = shape[(i + 1) % shape.length]!
      if (y1 > py !== y2 > py && px < x1 + ((py - y1) * (x2 - x1)) / (y2 - y1)) crossings++
    }
  return crossings % 2 === 1
}

const GRID_CENTRES: Point[] = Array.from({ length: GRID * GRID }, (_, i) => [
  1 + PITCH * (i % GRID),
  1 + PITCH * Math.floor(i / GRID),
])

/** Only dots that fit wholly inside the circle; the exports' clip leaves slivers of the rest. */
const WHOLE_DOTS = GRID_CENTRES.filter(
  ([x, y]) => Math.hypot(x - CENTRE, y - CENTRE) + DOT_R <= CENTRE,
)

export interface DotCircleArtwork {
  /** Centres of every dot drawn, before the pictogram is cut. */
  dots: readonly Point[]
  /** Top-left corners of the 4px cells the pictogram cuts out. */
  knockouts: readonly Point[]
  /** The cells sharing an edge with the heart, which a beat cuts too, so it swells and keeps its shape. Empty for the rest. */
  beat: readonly Point[]
}

export function dotCircleArtwork(icon: DotCircleIcon): DotCircleArtwork {
  const paths = PICTOGRAMS[icon]
  const cut = GRID_CENTRES.filter((centre) => paths.some((d) => inside(d, centre)))
  const isCut = (x: number, y: number) => cut.some(([cx, cy]) => cx === x && cy === y)
  const beat =
    icon === 'heart'
      ? GRID_CENTRES.filter(
          ([x, y]) =>
            !isCut(x, y) &&
            [
              [PITCH, 0],
              [-PITCH, 0],
              [0, PITCH],
              [0, -PITCH],
            ].some(([dx, dy]) => isCut(x + dx!, y + dy!)),
        )
      : []
  const corner = ([x, y]: Point) => [x - 2, y - 2] as const
  return { dots: WHOLE_DOTS, knockouts: cut.map(corner), beat: beat.map(corner) }
}
