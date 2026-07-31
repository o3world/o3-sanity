import type { ReactNode } from 'react'
import type { SanityQueries } from '@sanity/client'

import type { DocumentSeo } from '@/lib/seo'

/**
 * `SanityQueries` is the interface TypeGen augments via
 * `declare module '@sanity/client'` in `@o3/sanity/types/generated`. Each
 * registered `defineQuery(...)` becomes a key whose value is the generated
 * result type.
 *
 * **Design note on the generic constraint** (ported from vtx-web). `Q extends
 * string` (rather than `Q extends keyof SanityQueries`) mirrors how
 * `@sanity/client.fetch` itself is typed. Query constants carry their literal
 * types (plain template literals through `defineQuery`; interpolated fragments
 * are `as const` — the `groq` TAG would widen to `string`, TS#33304, so
 * queries must not use it), and a tight `keyof SanityQueries` constraint would
 * force casts at every registry entry call site.
 *
 * The renderer's prop type is derived via a conditional:
 * - `Q` is a registered TypeGen key → the exact `*Result` type.
 * - `Q` is some other literal → `unknown`; the caller sees a meaningful
 *   type error on use.
 * - `Q` widened to plain `string` → `never`. This is what makes entry
 *   collections work: `BaseEntry<Q>` uses `Q` covariantly (`query`) and
 *   contravariantly (`renderer`, `seo`), so it is invariant in `Q` —
 *   an entry with a literal query is only assignable to the erased
 *   `Any*Entry` shapes below because `RendererProps<string>` = `never` sits
 *   at the bottom of the contravariant slots.
 */
export type QueryKey = keyof SanityQueries
export type QueryResult<Q extends string> = string extends Q
  ? never
  : Q extends keyof SanityQueries
    ? SanityQueries[Q]
    : unknown

/**
 * Route-level context every renderer receives alongside the fetched document.
 * o3 is single-locale (ADR 0001), so this is just the resolved slug: the
 * path-tail for detail types, the full joined path for the catch-all, and
 * empty for singletons/listings.
 */
export interface RouteContext {
  readonly slug: string
}

/**
 * Combined renderer props: the GROQ result + the route context. Entry
 * renderers destructure `{ slug, ...doc }` from props.
 */
export type RendererProps<Q extends string> = NonNullable<QueryResult<Q>> & RouteContext

/** Common fields every content-type entry carries. */
interface BaseEntry<Q extends string> {
  readonly type: string
  readonly query: Q
  /**
   * A plain function type, NOT `ComponentType`: `ComponentType` includes
   * `ComponentClass`, whose instance `props` make it invariant in its props
   * parameter — which would block a concrete entry from being assignable to
   * the erased `Any*Entry` shapes. Every renderer is a function (server)
   * component, so nothing is lost.
   */
  readonly renderer: (props: RendererProps<Q>) => ReactNode
  /**
   * What this type contributes to its own SEO: the title/description/image
   * fallbacks and the route path the canonical is built from. NOT the
   * finished `Metadata` — the route builder folds this into the shared
   * resolution chain (`@/lib/seo`) together with the document's `seo`
   * overrides and Site Settings' defaults, so every routable type emits the
   * same complete tag set (#26).
   *
   * Omit it and the builder derives what it can from the document's own
   * `title`, `excerpt`, and `slug`.
   */
  readonly seo?: (doc: NonNullable<QueryResult<Q>>) => DocumentSeo
}

/** Catch-all entries serve `[...segments]/page.tsx` (slug from joined segments). */
export interface CatchAllEntry<Q extends string = string> extends BaseEntry<Q> {
  readonly kind: 'catchAll'
}

/**
 * Detail entries own a URL prefix and serve `<prefix>/[slug]/page.tsx`
 * (e.g. perspective at `/perspectives`, caseStudy at `/work`).
 */
export interface DetailEntry<Q extends string = string> extends BaseEntry<Q> {
  readonly kind: 'detail'
  /** URL prefix, leading `/`, no trailing `/`. Example: `'/work'`. */
  readonly urlPrefix: string
}

/**
 * Singleton entries own one exact URL and fetch with fixed query params
 * (e.g. the homepage: the `page` document whose slug is `"index"`).
 */
export interface SingletonEntry<Q extends string = string> extends BaseEntry<Q> {
  readonly kind: 'singleton'
  /** Fixed GROQ params for the fetch (e.g. `{ slug: 'index' }`). */
  readonly params?: Readonly<Record<string, string>>
}

export interface Pagination {
  readonly page: number
  readonly totalPages: number
}

export type ListingRendererProps<Q extends string> = NonNullable<QueryResult<Q>> & {
  readonly pagination: Pagination
}

/**
 * A paginated listing route (`?page=N`) over a collection. Unlike vtx-web,
 * o3 listings have no backing singleton document — the entry's `query` is a
 * combined `{ "items": ...[$offset...$end], "total": count(...) }` projection
 * and its SEO is static.
 */
export interface ListingEntry<Q extends string = string> {
  readonly kind: 'listing'
  /** The `_type`s the feed lists — they drive the fetch's cache tags. */
  readonly itemTypes: readonly string[]
  readonly query: Q
  /** Items per page. Default 12. */
  readonly pageSize?: number
  readonly renderer: (props: ListingRendererProps<Q>) => ReactNode
  /**
   * Static — there is no document to derive from — but it goes through the
   * same chain as every other route so a listing gets its canonical, robots,
   * and social tags rather than a bare title (#26).
   */
  readonly seo?: DocumentSeo
}

/**
 * Erased entry shapes for heterogeneous collections. Entries carry literal
 * query types, and `BaseEntry<Q>` routes `Q` through conditional types whose
 * variance TypeScript treats as unmeasurable — so a concrete entry is NOT
 * assignable to `CatchAllEntry<string>` even though every member is
 * compatible. These aliases spell out the same shape structurally (no shared
 * generic), so the assignability check succeeds member-by-member: `query`
 * widens to `string`, and `renderer`/`seo` accept the `never`-props
 * bottom — meaning you must narrow (or cast, as `renderEntry` does) before
 * calling through an erased entry.
 */
type Erased<E extends BaseEntry<string>> = Omit<E, 'renderer' | 'seo'> & {
  readonly renderer: (props: never) => ReactNode
  readonly seo?: (doc: never) => DocumentSeo
}
export type AnyCatchAllEntry = Erased<CatchAllEntry>
export type AnyDetailEntry = Erased<DetailEntry>
export type AnySingletonEntry = Erased<SingletonEntry>

/**
 * The structural subset `buildCatchAllRoute` actually consumes. Detail
 * entries qualify as-is (their `kind`/`urlPrefix` are simply unused).
 */
export type RoutableEntry = Pick<AnyCatchAllEntry, 'type' | 'renderer' | 'seo'>
