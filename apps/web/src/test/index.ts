/**
 * The `render` test layer's public surface — import everything from `@/test`.
 *
 *   import { renderRoute, aPerspective } from '@/test'
 *
 * Deliberately narrow: it exports what tests use today, not what they might.
 * `installDataset` (drive the fetch stub by hand) lives in ./stubs/sanity-live
 * — promote it here when a test needs it.
 *
 * See docs/testing.md for which layer to reach for.
 */
export { expectNotFound, renderRoute } from './renderRoute'

export {
  aMigratedPage,
  aMigratedPerspective,
  aPerspective,
  aPerspectivesPage,
  aSeededPage,
  migratedPageSlugs,
  migratedPerspectiveSlugs,
  paragraph,
  siteSettings,
  withSettings,
} from './fixtures'
