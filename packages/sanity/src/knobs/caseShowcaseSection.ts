import { defineBlockKnobs } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { CaseShowcaseSection } from '../types/generated'

/**
 * The case-study showcase's design options — `surface` and nothing else.
 *
 * The sticky-stacking cards are the band's whole composition, and each one
 * pulls its narrative headline and headline stat from the case study it points
 * at. Nothing about that is a pick: what the band shows follows from the
 * documents in `caseStudies`.
 *
 * `ink` because the cards are drawn to stack against the dark band.
 */
export const caseShowcaseSectionKnobs = defineBlockKnobs({
  type: 'caseShowcaseSection',
  title: 'Case study showcase',
  tier: 'section',
  knobs: [surfaceKnob({ initialValue: 'ink' })],
  /** `caseStudies` stays empty — a placeholder never references a document. */
  placeholder: {
    _type: 'caseShowcaseSection',
    heading: 'A heading for this showcase.',
  } satisfies CaseShowcaseSection,
})
