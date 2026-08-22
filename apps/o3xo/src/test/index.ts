/**
 * This app's instance of the `render` test layer — import everything from
 * `@/test`.
 *
 *   import { renderRoute, anInsight } from '@/test'
 *
 * Two halves. `@o3/render-kit` is the layer itself: `renderRoute`, the module
 * stubs, and the fixtures typed against the shared queries. `./fixtures` reads
 * this app's committed bootstrap documents.
 *
 * The project that collects these tests pins `NEXT_PUBLIC_BRAND=o3xo`
 * (`vitest.config.mts`), so every prefix, title and canonical below is this
 * brand's rather than the default O3 one.
 */
export * from '@o3/render-kit'

export { aCorpusPage } from './fixtures'
