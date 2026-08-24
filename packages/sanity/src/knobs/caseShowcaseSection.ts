import { defineBlockKnobs } from '@o3/block-spec'
import type { CaseShowcaseSection } from '../types/generated'

/**
 * The case-study showcase has NO design options, and that is the declaration.
 *
 * The sticky-stacking cards are the band's whole composition, and each one
 * pulls its narrative headline and headline stat from the case study it points
 * at. Nothing about that is a pick: what the band shows follows from the
 * documents in `caseStudies`.
 *
 * Nor is its surface. The frame fills the band flat with `neutral/black`
 * (`1683:2656`), and the cards composite their own scrim over photography, so
 * a lighter band would leave them floating on nothing. An empty `knobs` array
 * is the honest answer — ADR 0020's guard reads it both ways, so a block with
 * no controls and a block with no design fields agree by construction.
 */
export const caseShowcaseSectionKnobs = defineBlockKnobs({
  type: 'caseShowcaseSection',
  title: 'Case study showcase',
  tier: 'section',
  knobs: [],
  // A flat `neutral/black` fill with white copy over it.
  paintsOwnSurface: 'ink',
  /** `caseStudies` stays empty — a placeholder never references a document. */
  placeholder: {
    _type: 'caseShowcaseSection',
    heading: 'A heading for this showcase.',
  } satisfies CaseShowcaseSection,
})
