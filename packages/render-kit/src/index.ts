/**
 * The `render` test layer's public surface. An app re-exports it from its own
 * `src/test/index.ts`, so a test written in either app reads the same:
 *
 *   import { renderRoute, anInsight } from '@/test'
 *
 * Deliberately narrow: it exports what tests use today, not what they might.
 * `installDataset` (drive the fetch stub by hand) lives in ./stubs/sanity-live
 * — promote it here when a test needs it.
 *
 * See docs/testing.md for which layer to reach for, and this package's README
 * for how an app instantiates the layer.
 *
 * **A story imports `@o3/render-kit/fixtures` instead.** This barrel reaches
 * `renderRoute`, which reaches `node:stream`, and the stories layer runs in a
 * browser — so a story that wants the same fixture data takes the subpath and
 * leaves the renderer behind.
 */
export { bandPaths, subBlockPaths } from './attribution'

export { expectNotFound, renderRoute } from './renderRoute'
export type { RenderRouteOptions, RenderRouteResult, RouteShimLike } from './renderRoute'

export type { DatasetResolver, FetchCall } from './stubs/sanity-live'

export {
  classTokens,
  unprefixedHorizontalScrollUtilities,
  variantsOf,
} from '@o3/content-ui/testing'

export {
  aCaseStudiesPage,
  aCaseStudy,
  aCaseStudyCard,
  anInsight,
  anInsightsPage,
  paragraph,
  siteSettings,
  withSettings,
} from './fixtures'
export type { CaseStudy, CaseStudyCard, Insight } from './fixtures'
