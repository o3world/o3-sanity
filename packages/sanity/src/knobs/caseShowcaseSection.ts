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
 * Nor is its surface. The frame paints two gradient washes across the band
 * (`1683:2657` and `1683:2661`) and the renderer draws them; the `surface`
 * knob that used to sit here named a colour no reader ever saw. An empty
 * `knobs` array is the honest answer — ADR 0020's guard reads it both ways, so
 * a block with no controls and a block with no design fields agree by
 * construction.
 */
export const caseShowcaseSectionKnobs = defineBlockKnobs({
  type: 'caseShowcaseSection',
  title: 'Case study showcase',
  tier: 'section',
  knobs: [],
  // Two gradient washes, both light, and the copy over them takes `text-fg`.
  paintsOwnSurface: 'white',
  /** `caseStudies` stays empty — a placeholder never references a document. */
  placeholder: {
    _type: 'caseShowcaseSection',
    heading: 'A heading for this showcase.',
  } satisfies CaseShowcaseSection,
})
