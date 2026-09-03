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
import type { Brand } from '../brand'
import {
  BLOCK_ARRAYS,
  blockArraysFor,
  type BlockArrays,
  type SectionBlockName,
} from './blocks/registry'
import {
  heroSection,
  logoWallSection,
  caseShowcaseSection,
  railPanelsSection,
  quoteSection,
  insightsCarouselSection,
  ctaSection,
  faqSection,
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
 * Every section block's schema, by name — the lookup the roster reads.
 *
 * A brand's Studio registers the blocks that brand's app can render (ADR 0028),
 * so this is keyed rather than listed: the roster decides which of them reach
 * the built list, and `Record<SectionBlockName, …>` is what fails when a block
 * is registered and never defined.
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
  statsSection,
} satisfies Record<SectionBlockName, unknown>

/**
 * The schema one roster builds — every type a Studio registers, in one list.
 *
 * The roster reaches the built schema twice, and both readings come from the
 * same `arrays`: which section schemas are registered at all, and which of them
 * `page.sections` and `caseStudy.story` offer. A block the roster leaves out is
 * absent from the Studio rather than merely un-offered, so an editor cannot
 * reach it through a paste or an old document either.
 */
const schemaTypesWith = (arrays: BlockArrays) => [
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
  // section blocks — this roster's, in registry order
  ...arrays['page.sections'].map((name) => SECTION_SCHEMAS[name]),
  // documents
  insight,
  caseStudy(arrays),
  page(arrays),
  collectionIndex(arrays),
  person,
  client,
  category,
  industry,
  siteSettings,
  brief,
]

/**
 * The whole content model — one model with one typegen, which ADR 0028 keeps as
 * the thing the brands may not fork.
 *
 * This is what `sanity schema extract` reads from `packages/sanity`, what the
 * migration tools compile portable text against, and what the invariants over
 * the committed JSON check: all of them have to see blocks that no single
 * Studio offers. A Studio takes `schemaTypesFor` instead.
 */
export const schemaTypes = schemaTypesWith(BLOCK_ARRAYS)

/**
 * The schema one brand's Studio loads — core plus that brand's own sections.
 *
 * Both brands load through this one function (#251), so putting a block in a
 * Studio is exactly one edit: name it in `BRAND_SECTION_BLOCKS.<brand>`. An O3
 * editor is then never offered a band `apps/web` has no renderer for.
 */
export const schemaTypesFor = (brand: Brand) => schemaTypesWith(blockArraysFor(brand))
