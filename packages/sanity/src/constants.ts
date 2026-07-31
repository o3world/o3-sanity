export const PROJECT_ID = 'naorcr6k'
export const DATASETS = ['production', 'development'] as const

/** Document types the web app routes (ADR 0001: every one carries a required slug). */
export const ROUTABLE_TYPES = ['perspective', 'caseStudy', 'page'] as const
export type RoutableType = (typeof ROUTABLE_TYPES)[number]

/** URL prefixes per collection; `page` slugs are multi-segment and carry their own prefix. */
export const COLLECTION_PREFIXES = {
  perspective: '/perspectives',
  caseStudy: '/work',
} as const

export const PAGE_TYPES = ['standard', 'service'] as const
export type PageType = (typeof PAGE_TYPES)[number]

export const SURFACES = ['white', 'bone', 'ink'] as const
export type Surface = (typeof SURFACES)[number]
