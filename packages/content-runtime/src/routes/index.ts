/**
 * The route layer an app re-exports from its `page.tsx` files: the four
 * builders, the `define*` helpers their entries are declared with, the entry
 * types, and the cache-tag scheme both the builders and `/api/revalidate`
 * derive from.
 */
export {
  buildCatchAllRoute,
  buildDetailRoute,
  buildIndexRoute,
  buildSingletonRoute,
  type CatchAllRouteShim,
  type DetailRouteShim,
  type IndexParams,
  type IndexRouteShim,
  type SingletonRouteShim,
} from './build'
export {
  defineCatchAllType,
  defineDetailType,
  defineIndexType,
  defineSingletonType,
} from './define'
export { docTag, typeTag } from './cacheTags'
export {
  indexHref,
  indexQueryRedirects,
  readIndexState,
  type IndexRedirect,
  type IndexState,
} from './indexPaths'
export { decodePathParam } from './decodePathParam'
export { atLeastOne, publishedIndexTotal, publishedSlugs } from './staticParams'
export { pageRange } from './pagination'
export type {
  AnyCatchAllEntry,
  AnyDetailEntry,
  AnySingletonEntry,
  CatchAllEntry,
  DetailEntry,
  Facets,
  IndexDocument,
  IndexEntry,
  IndexRendererProps,
  Pagination,
  QueryKey,
  QueryResult,
  RendererProps,
  RoutableEntry,
  RouteContext,
  RouteProvenance,
  SingletonEntry,
} from './types'
