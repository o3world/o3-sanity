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
import { caseShowcaseSectionKnobs } from './caseShowcaseSection'
import { ctaSectionKnobs } from './ctaSection'
import { disciplineGridSectionKnobs } from './disciplineGridSection'
import { formSectionKnobs } from './formSection'
import { heroSectionKnobs } from './heroSection'
import { inFlightSectionKnobs } from './inFlightSection'
import { insightsCarouselSectionKnobs } from './insightsCarouselSection'
import { layoutSectionKnobs } from './layoutSection'
import { listingSectionKnobs } from './listingSection'
import { logoWallSectionKnobs } from './logoWallSection'
import { mediaSectionKnobs } from './mediaSection'
import { personGridSectionKnobs } from './personGridSection'
import { quoteSectionKnobs } from './quoteSection'
import { railPanelsSectionKnobs } from './railPanelsSection'
import { roleListSectionKnobs } from './roleListSection'
import { screenGridSectionKnobs } from './screenGridSection'

export { caseShowcaseSectionKnobs } from './caseShowcaseSection'
export { ctaSectionKnobs } from './ctaSection'
export { decorationKnob } from './decoration'
export { disciplineGridSectionKnobs } from './disciplineGridSection'
export { formSectionKnobs } from './formSection'
export { heroSectionKnobs } from './heroSection'
export { inFlightSectionKnobs } from './inFlightSection'
export { insightsCarouselSectionKnobs } from './insightsCarouselSection'
export { layoutSectionKnobs } from './layoutSection'
export { listingSectionKnobs } from './listingSection'
export { logoWallSectionKnobs } from './logoWallSection'
export { mediaSectionKnobs } from './mediaSection'
export { personGridSectionKnobs } from './personGridSection'
export { quoteSectionKnobs } from './quoteSection'
export { railPanelsSectionKnobs } from './railPanelsSection'
export { roleListSectionKnobs } from './roleListSection'
export { screenGridSectionKnobs, screenKnobs } from './screenGridSection'
export { surfaceKnob } from './surface'

/**
 * Every block, keyed by its Sanity `_type` — what a consumer reads when it has
 * a document and needs the knobs behind it (#106's canvas toolbar).
 *
 * **Complete since #113.** Every one of the sixteen section blocks declares its
 * design options here, so a miss is now a block that does not exist rather than
 * a block nobody has converted yet, and `defineSectionBlock` requires the
 * declaration — there is no longer a way for a block to reach the form with
 * design options no editorial surface can see. The order matches
 * `SECTION_BLOCKS`, so the two lists read against each other.
 *
 * Keyed off each spec's own `type` rather than a literal, so a block cannot be
 * filed under a name its declaration does not answer to.
 */
export const BLOCK_KNOBS: Readonly<Record<string, BlockKnobs>> = {
  [heroSectionKnobs.type]: heroSectionKnobs,
  [logoWallSectionKnobs.type]: logoWallSectionKnobs,
  [caseShowcaseSectionKnobs.type]: caseShowcaseSectionKnobs,
  [railPanelsSectionKnobs.type]: railPanelsSectionKnobs,
  [quoteSectionKnobs.type]: quoteSectionKnobs,
  [insightsCarouselSectionKnobs.type]: insightsCarouselSectionKnobs,
  [ctaSectionKnobs.type]: ctaSectionKnobs,
  [disciplineGridSectionKnobs.type]: disciplineGridSectionKnobs,
  [personGridSectionKnobs.type]: personGridSectionKnobs,
  [roleListSectionKnobs.type]: roleListSectionKnobs,
  [inFlightSectionKnobs.type]: inFlightSectionKnobs,
  [formSectionKnobs.type]: formSectionKnobs,
  [layoutSectionKnobs.type]: layoutSectionKnobs,
  [mediaSectionKnobs.type]: mediaSectionKnobs,
  [screenGridSectionKnobs.type]: screenGridSectionKnobs,
  [listingSectionKnobs.type]: listingSectionKnobs,
}
