import { seo } from './objects/seo'
import { migration } from './objects/migration'
import { cta } from './objects/cta'
import { figure } from './objects/figure'
import { stat } from './objects/stat'
import { embed } from './objects/embed'
import { pullQuote } from './objects/pullQuote'
import { bodyText } from './objects/bodyText'
import { chapter } from './objects/chapter'
import { richText, statGroup } from './blocks/base'
import {
  heroSection,
  logoWallSection,
  caseShowcaseSection,
  railPanelsSection,
  quoteSection,
  perspectivesCarouselSection,
  ctaSection,
  layoutSection,
  mediaSection,
  listingSection,
} from './blocks/section'
import { perspective } from './documents/perspective'
import { caseStudy } from './documents/caseStudy'
import { page } from './documents/page'
import { person, client, category, industry, siteSettings } from './documents/supporting'

export const schemaTypes = [
  // objects
  seo,
  migration,
  cta,
  figure,
  stat,
  embed,
  pullQuote,
  bodyText,
  chapter,
  // base blocks
  richText,
  statGroup,
  // section blocks
  heroSection,
  logoWallSection,
  caseShowcaseSection,
  railPanelsSection,
  quoteSection,
  perspectivesCarouselSection,
  ctaSection,
  layoutSection,
  mediaSection,
  listingSection,
  // documents
  perspective,
  caseStudy,
  page,
  person,
  client,
  category,
  industry,
  siteSettings,
]
