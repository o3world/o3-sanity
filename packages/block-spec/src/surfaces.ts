import type { KnobSurface, SurfaceRule } from './types'

/**
 * WHICH SURFACE OWNS A KNOB, expressed as data.
 *
 * The rule underneath is: **a knob belongs to the surface of the container it
 * configures.** `surface` paints the band, so the band's chrome carries it;
 * `variant` reshapes the block, so the block's does.
 *
 * KEYED ON PATH PREFIX, NOT FIELD NAME. The layout builder (#115) will add
 * row-scoped knobs (`rows[].columns` and friends); a prefix table absorbs
 * those by appending a row, where a switch over field names has to be reopened
 * and re-reasoned every time. Ownership is answered here and nowhere else, so
 * no surface carries its own roster of field names to keep in step.
 */
export const SURFACE_RULES: readonly SurfaceRule[] = [
  // The one field `defineSectionBlock` injects into every section block. It
  // configures the band the block occupies rather than the block, which is
  // also why a nested block drops it — see the nesting gate in `visibleKnobs`.
  { prefix: 'surface', surface: 'band' },
]

/**
 * Where an unlisted knob lands. `block`, because a knob declared at the block
 * root (`variant`, `layout`, `decoration`) configures the block itself — the
 * thing the block's own chrome already speaks for. A new nested cluster that
 * wants its own surface says so with a rule; nothing silently disappears into
 * a menu nobody opened.
 */
export const DEFAULT_KNOB_SURFACE: KnobSurface = 'block'

/**
 * Segment-boundary matching, never a bare `startsWith` — `surfaceOverride`
 * must not be read as a child of `surface`.
 */
const covers = (path: string, prefix: string): boolean =>
  path === prefix || path.startsWith(`${prefix}.`)

/**
 * Order in the table is irrelevant: the **longest matching prefix wins**, so a
 * rule can be appended wherever it reads best rather than slotted above the
 * rule it refines.
 */
export function surfaceForKnobPath(
  path: string,
  rules: readonly SurfaceRule[] = SURFACE_RULES,
): KnobSurface {
  let winner: SurfaceRule | undefined
  for (const rule of rules) {
    if (!covers(path, rule.prefix)) continue
    if (!winner || rule.prefix.length > winner.prefix.length) winner = rule
  }
  return winner?.surface ?? DEFAULT_KNOB_SURFACE
}
