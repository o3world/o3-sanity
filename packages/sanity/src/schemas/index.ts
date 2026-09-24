import {
  backgroundMedia,
  bodyText,
  button,
  buttonGroup,
  chapter,
  embed,
  figure,
  mark,
  migration,
  pullQuote,
  seo,
  stat,
} from './objects'
import { mediaCard, richText, statGroup } from './blocks/base'
import { BLOCK_ARRAYS, SECTION_BLOCKS, type SectionBlockName } from './blocks/registry'
import {
  heroSection,
  logoWallSection,
  caseShowcaseSection,
  railPanelsSection,
  quoteSection,
  insightsCarouselSection,
  ctaSection,
  statsSection,
  featureGridSection,
  personGridSection,
  roleListSection,
  inFlightSection,
  formSection,
  layoutSection,
  mediaSection,
  screenGridSection,
  listingSection,
} from './blocks/section'
import { insight } from './documents/insight'
import { caseStudy } from './documents/caseStudy'
import { page } from './documents/page'
import { collectionIndex } from './documents/collectionIndex'
import { person, client, category, industry, siteSettings } from './documents/supporting'
import { brief } from './documents/brief'

/**
 * Every section block's schema, by name. Keyed rather than listed so
 * `Record<SectionBlockName, …>` fails when a block is registered and never
 * defined; the registry's order is what reaches the built list.
 */
const SECTION_SCHEMAS = {
  heroSection,
  logoWallSection,
  caseShowcaseSection,
  railPanelsSection,
  quoteSection,
  insightsCarouselSection,
  ctaSection,
  featureGridSection,
  personGridSection,
  roleListSection,
  inFlightSection,
  formSection,
  layoutSection,
  mediaSection,
  screenGridSection,
  listingSection,
  statsSection,
} satisfies Record<SectionBlockName, unknown>

/**
 * The whole content model — every type the Studio registers, in one list.
 *
 * This is what the Studio loads, what `sanity schema extract` reads for
 * typegen, what the migration tools compile portable text against, and what
 * the invariants over the committed JSON check.
 */
export const schemaTypes = [
  // objects
  seo,
  migration,
  button,
  buttonGroup,
  figure,
  stat,
  embed,
  pullQuote,
  bodyText,
  chapter,
  mark,
  backgroundMedia,
  // base blocks
  richText,
  mediaCard,
  statGroup,
  // section blocks, in registry order
  ...SECTION_BLOCKS.map((name) => SECTION_SCHEMAS[name]),
  // documents
  insight,
  caseStudy(BLOCK_ARRAYS),
  page(BLOCK_ARRAYS),
  collectionIndex(BLOCK_ARRAYS),
  person,
  client,
  category,
  industry,
  siteSettings,
  brief,
]
