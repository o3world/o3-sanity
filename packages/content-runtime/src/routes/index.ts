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
export { decodePathParam } from './decodePathParam'
export { publishedSlugs } from './staticParams'
export { clampPage, pageRange, parsePage } from './pagination'
export type {
  AnyCatchAllEntry,
  AnyDetailEntry,
  AnySingletonEntry,
  CatchAllEntry,
  DetailEntry,
  Facets,
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
