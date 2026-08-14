/**
 * `@o3/sanity/knobs` — every block's design options, as data.
 *
 * **Nothing in this directory may import `sanity` or `@sanity/*`** (ADR 0020,
 * lint-enforced in `eslint.config.mjs`). The Presentation overlay runs inside
 * the site bundle and has to read this; an edge to the Studio runtime here is
 * exactly the constraint that made the prior art derive the pure artifact from
 * the impure one. The adapter that turns a knob into a `defineField` lives on
 * the other side of that line, in `schemas/blocks/knobFields.ts`.
 *
 * One file per block, named for the block. Their own directory rather than
 * beside their schema, because all sixteen section blocks share a single
 * `schemas/blocks/section.ts` and there is no "beside".
 */

import type { BlockKnobs } from '@o3/block-spec'
import { disciplineGridSectionKnobs } from './disciplineGridSection'
import { heroSectionKnobs } from './heroSection'
import { inFlightSectionKnobs } from './inFlightSection'
import { layoutSectionKnobs } from './layoutSection'
import { mediaSectionKnobs } from './mediaSection'
import { railPanelsSectionKnobs } from './railPanelsSection'
import { screenGridSectionKnobs } from './screenGridSection'

export { disciplineGridSectionKnobs } from './disciplineGridSection'
export { heroSectionKnobs } from './heroSection'
export { inFlightSectionKnobs } from './inFlightSection'
export { layoutSectionKnobs } from './layoutSection'
export { mediaSectionKnobs } from './mediaSection'
export { railPanelsSectionKnobs } from './railPanelsSection'
export { screenGridSectionKnobs, screenKnobs } from './screenGridSection'
export { surfaceKnob } from './surface'

/**
 * Every converted block, keyed by its Sanity `_type` — what a consumer reads
 * when it has a document and needs the knobs behind it (#106's canvas
 * toolbar).
 *
 * **Partial until #113.** A block absent from this map declares its design
 * options as plain schema fields, and every editorial surface outside the
 * Studio form is silent about them. That is the migration state ADR 0020
 * accepts, so a caller must treat a miss as "no knobs yet", never as "no
 * knobs".
 *
 * Keyed off each spec's own `type` rather than a literal, so a block cannot be
 * filed under a name its declaration does not answer to.
 */
export const BLOCK_KNOBS: Readonly<Record<string, BlockKnobs>> = {
  [heroSectionKnobs.type]: heroSectionKnobs,
  [railPanelsSectionKnobs.type]: railPanelsSectionKnobs,
  [disciplineGridSectionKnobs.type]: disciplineGridSectionKnobs,
  [inFlightSectionKnobs.type]: inFlightSectionKnobs,
  [mediaSectionKnobs.type]: mediaSectionKnobs,
  [layoutSectionKnobs.type]: layoutSectionKnobs,
  [screenGridSectionKnobs.type]: screenGridSectionKnobs,
}
