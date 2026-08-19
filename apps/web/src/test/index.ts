/**
 * The `render` test layer's public surface — import everything from `@/test`.
 *
 *   import { renderRoute, anInsight } from '@/test'
 *
 * Deliberately narrow: it exports what tests use today, not what they might.
 * `installDataset` (drive the fetch stub by hand) lives in ./stubs/sanity-live
 * — promote it here when a test needs it.
 *
 * See docs/testing.md for which layer to reach for.
 */
export { bandPaths, subBlockPaths } from './attribution'

export { expectNotFound, renderRoute } from './renderRoute'

export {
  classTokens,
  unprefixedHorizontalScrollUtilities,
  variantsOf,
} from '@o3/content-ui/testing'

export {
  aCaseStudiesPage,
  aCaseStudyCard,
  aMigratedPage,
  aMigratedInsight,
  anInsight,
  anInsightsPage,
  aSeededPage,
  aTranslatedCaseStudy,
  migratedPageSlugs,
  migratedInsightSlugs,
  paragraph,
  siteSettings,
  withSettings,
} from './fixtures'
