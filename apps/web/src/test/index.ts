/**
 * This app's instance of the `render` test layer — import everything from
 * `@/test`.
 *
 *   import { renderRoute, anInsight } from '@/test'
 *
 * Two halves. `@o3/render-kit` is the layer itself: `renderRoute`, the module
 * stubs, and the fixtures typed against the shared queries. Everything after
 * it reads O3's migrated corpus off disk, which is this app's content and no
 * other app's.
 *
 * See docs/testing.md for which layer to reach for, and the kit's README for
 * how a second app instantiates it.
 */
export * from '@o3/render-kit'

export { declaredSizes, imageTags, preloadedImageTags } from './images'

export {
  aMigratedPage,
  aMigratedInsight,
  aSeededPage,
  aTranslatedCaseStudy,
  migratedPageSlugs,
  migratedInsightSlugs,
} from './fixtures'
