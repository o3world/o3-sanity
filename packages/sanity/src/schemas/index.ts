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
import { richText, statGroup } from './blocks/base'
import { rosterSectionBlocks, type SectionBlockName } from './blocks/registry'
import {
  heroSection,
  logoWallSection,
  caseShowcaseSection,
  railPanelsSection,
  quoteSection,
  insightsCarouselSection,
  ctaSection,
  faqSection,
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
import { person, client, category, industry, siteSettings } from './documents/supporting'
import { brief } from './documents/brief'

/**
 * Every section block's schema, by name — the lookup the roster reads.
 *
 * A brand's Studio registers the blocks that brand's app can render (ADR 0028),
 * so this is keyed rather than listed: `rosterSectionBlocks()` decides which of
 * them reach `schemaTypes`, and `Record<SectionBlockName, …>` is what fails
 * when a block is registered and never defined.
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
  faqSection,
} satisfies Record<SectionBlockName, unknown>

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
  statGroup,
  // section blocks — this brand's roster, in registry order
  ...rosterSectionBlocks().map((name) => SECTION_SCHEMAS[name]),
  // documents
  insight,
  caseStudy,
  page,
  person,
  client,
  category,
  industry,
  siteSettings,
  brief,
]
