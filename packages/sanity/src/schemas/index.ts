import {
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
import {
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
} from './blocks/section'
import { insight } from './documents/insight'
import { caseStudy } from './documents/caseStudy'
import { page } from './documents/page'
import { person, client, category, industry, siteSettings } from './documents/supporting'
import { guidance } from './documents/guidance'
import { brief } from './documents/brief'

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
  // base blocks
  richText,
  statGroup,
  // section blocks
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
  // documents
  insight,
  caseStudy,
  page,
  person,
  client,
  category,
  industry,
  siteSettings,
  guidance,
  brief,
]
