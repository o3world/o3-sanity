import type { SectionProps } from '@o3/content-runtime/blocks'

/**
 * Card SHAPES declared apart from their card, so a view that draws the card
 * directly can type its data without importing the component.
 */

/**
 * The case-study card shape — the `CASE_STUDY_CARD` projection, pinned to the
 * caseShowcaseSection's dereferenced references.
 */
export type CaseStudyCardData = NonNullable<
  SectionProps<'caseShowcaseSection'>['caseStudies']
>[number]
