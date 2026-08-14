import { stegaClean } from '@sanity/client/stega'

import { SURFACES, type Surface } from '@o3/sanity/constants'

/**
 * Resolve a block's editor-chosen `surface` to the three-surface union
 * `SectionShell` accepts. `stegaClean` strips the invisible stega characters
 * draft-mode strings carry (a stega'd `"ink"` would fail the comparison and
 * silently fall back).
 *
 * Each renderer passes the `initialValue` its block's `surface` knob declares
 * (`packages/sanity/src/knobs/<block>.ts`) as the fallback, so a document saved
 * before the field existed renders as designed. It is spelled at the call site
 * rather than read from the declaration because the renderer is a pure
 * component and the value is a literal in its own JSX — and the two agreeing is
 * checked by nothing, which is the same seam the schema's old `defaultSurface`
 * argument sat on before #120 retired it.
 */
export function resolveSurface(value: string | null | undefined, fallback: Surface): Surface {
  const clean = stegaClean(value)
  return SURFACES.includes(clean as Surface) ? (clean as Surface) : fallback
}
