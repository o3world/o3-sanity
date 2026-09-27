import { defineBlockKnobs } from '@o3/block-spec'
import type { CaseShowcaseSection } from '../types/generated'

/** The showcase's light surface belongs to its composition. */
export const caseShowcaseSectionKnobs = defineBlockKnobs({
  type: 'caseShowcaseSection',
  title: 'Case study showcase',
  tier: 'section',
  knobs: [],
  paintsOwnSurface: 'bone',
  /** `caseStudies` stays empty — a placeholder never references a document. */
  placeholder: {
    _type: 'caseShowcaseSection',
    heading: 'A heading for this showcase.',
  } satisfies CaseShowcaseSection,
})
