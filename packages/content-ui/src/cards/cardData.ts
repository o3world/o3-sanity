import type { SectionProps } from '@o3/content-runtime/blocks'

/**
 * The card SHAPES whose drawing is app-first (`APP_FIRST_RENDERERS`).
 *
 * A demotion moves the renderer and nothing else: the schema is shared, the
 * projection is shared, and so is the type the projection produces — two
 * drawings of one shape is the whole point of the rule (#286). A shape whose
 * card still lives here is declared beside that card instead; this module is
 * the home for the ones whose card no longer has one.
 */

/**
 * The case-study card shape — the `CASE_STUDY_CARD` projection, pinned to the
 * caseShowcaseSection's dereferenced references.
 */
export type CaseStudyCardData = NonNullable<
  SectionProps<'caseShowcaseSection'>['caseStudies']
>[number]
