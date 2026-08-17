import { stegaClean } from '@sanity/client/stega'

import { SURFACES, type Surface } from '@o3/sanity/constants'
import { BLOCK_KNOBS } from '@o3/sanity/knobs'

import type { PageSection } from '@/content/blocks/sectionTypes'

/**
 * Each block's declared surface default, keyed by its Sanity `_type` — read off
 * the `surface` knob in `packages/sanity/src/knobs/<block>.ts`, never restated.
 *
 * A block whose knob declares nothing is absent here rather than defaulted, so
 * the one arm below that has to invent an answer stays visible. Nothing reaches
 * it today: all sixteen section blocks carry `surfaceKnob`, which `knob()`
 * refuses to build without an `initialValue` naming one of its options.
 */
const DECLARED_SURFACE: Readonly<Record<string, Surface>> = Object.fromEntries(
  Object.entries(BLOCK_KNOBS).flatMap(([type, spec]) => {
    const declared = spec.knobs.find((knob) => knob.name === 'surface')?.initialValue
    return SURFACES.includes(declared as Surface) ? [[type, declared as Surface]] : []
  }),
)

/**
 * Resolve a block's editor-chosen `surface` to the three-surface union
 * `SectionShell` accepts. `stegaClean` strips the invisible stega characters
 * draft-mode strings carry (a stega'd `"ink"` would fail the comparison and
 * silently fall back).
 *
 * A document saved before the field existed stores nothing, so the renderer
 * falls back to the `initialValue` its block's `surface` knob declares. The
 * caller names the BLOCK, not the colour: a fallback spelled per renderer is a
 * mirror of the declaration that nothing checks, and changing the declaration
 * would then repaint new documents while leaving every existing one on the old
 * band colour — the silent drift ADR 0020 retired `defaultSurface` to stop.
 */
export function resolveSurface(
  value: string | null | undefined,
  block: PageSection['_type'],
): Surface {
  const clean = stegaClean(value)
  if (SURFACES.includes(clean as Surface)) return clean as Surface
  return DECLARED_SURFACE[block] ?? 'white'
}
