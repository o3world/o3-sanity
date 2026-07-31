import { stegaClean } from '@sanity/client/stega'

import { SURFACES, type Surface } from '@o3/sanity/constants'

/**
 * Resolve a block's editor-chosen `surface` to the three-surface union
 * `SectionShell` accepts. `stegaClean` strips the invisible stega characters
 * draft-mode strings carry (a stega'd `"ink"` would fail the comparison and
 * silently fall back). Each block passes its schema `defaultSurface` as the
 * fallback so old documents render as designed.
 */
export function resolveSurface(value: string | null | undefined, fallback: Surface): Surface {
  const clean = stegaClean(value)
  return SURFACES.includes(clean as Surface) ? (clean as Surface) : fallback
}
