/**
 * The schema-free block registry: single source of block membership. A block
 * that isn't listed here cannot be defined (the factories throw), and the web
 * app's BLOCK_REGISTRY is compile-checked against the generated types derived
 * from these schemas — so schema and renderers cannot drift apart.
 */
export const SECTION_BLOCKS = [
  'heroSection',
  'logoWallSection',
  'caseShowcaseSection',
  'railPanelsSection',
  'quoteSection',
  'insightsCarouselSection',
  'ctaSection',
  'disciplineGridSection',
  'personGridSection',
  'roleListSection',
  'inFlightSection',
  'formSection',
  'layoutSection',
  'mediaSection',
  'screenGridSection',
  'listingSection',
] as const

export const BASE_BLOCKS = ['richText', 'figure', 'embed', 'cta', 'statGroup'] as const

export type SectionBlockName = (typeof SECTION_BLOCKS)[number]
export type BaseBlockName = (typeof BASE_BLOCKS)[number]
