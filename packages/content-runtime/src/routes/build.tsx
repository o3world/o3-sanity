import { cache } from 'react'
import type { ComponentType, JSX, ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { sanityFetch } from '#live'
import { getSiteSettings } from '../siteSettings'
import { clampPage, pageRange, parsePage } from './pagination'
import { buildDocumentMetadata, type DocumentSeo, type SeoOverrides } from '../seo'
import { hrefForDoc } from '../urls'

import { docTag, typeTag } from './cacheTags'
import { decodePathParam } from './decodePathParam'

import type {
  DetailEntry,
  Facets,
  IndexEntry,
  QueryResult,
  RoutableEntry,
  RouteContext,
  SingletonEntry,
} from './types'

/**
 * The four route builders (ADR 0001): each turns an entry (or entry list)
 * into a `{ generateMetadata, Page }` shim that a `page.tsx` re-exports.
 * They hide the React.cache-shared fetch (one sanityFetch per request across
 * generateMetadata + Page), the cache-tag wiring `/api/revalidate` relies on,
 * `_type` dispatch, and metadata extraction.
 *
 * The vtx-web original's i18n (locale param, fallbackOrNotFound,
 * buildAlternates), legacy path rewrites, and materialized-path matching are
 * deliberately not ported — o3 is single-locale and matches on `slug.current`.
 *
 * **No builder here turns stega on** (#229). next-sanity's `defineLive` gates
 * it on a server token, a `studioUrl` and draft mode; a `stega: true` at a
 * call site overrides all three and hands the invisible characters to every
 * anonymous visitor. A body fetch therefore passes no `stega` and inherits the
 * gate — `stega?: false` is the only value a caller may name. See the README.
 */

export interface DetailRouteShim {
  readonly generateMetadata: (props: { params: Promise<{ slug: string }> }) => Promise<Metadata>
  readonly Page: (props: { params: Promise<{ slug: string }> }) => Promise<JSX.Element>
}

export interface CatchAllRouteShim {
  readonly generateMetadata: (props: {
    params: Promise<{ segments?: string[] }>
  }) => Promise<Metadata>
  readonly Page: (props: { params: Promise<{ segments?: string[] }> }) => Promise<JSX.Element>
}

export interface SingletonRouteShim {
  readonly generateMetadata: () => Promise<Metadata>
  readonly Page: () => Promise<JSX.Element>
}

export interface IndexRouteShim {
  readonly generateMetadata: () => Promise<Metadata>
  readonly Page: (props: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
  }) => Promise<JSX.Element>
}

interface BaseEntryLike<Q extends string> {
  readonly seo?: (doc: NonNullable<QueryResult<Q>>) => DocumentSeo
}

/**
 * Build the complete tag set for a matched entry/doc pair (#26).
 *
 * The entry contributes only what is document-shaped — title, description and
 * image fallbacks, and the route path. Everything else (the override chain,
 * Site Settings defaults, canonical, robots, OpenGraph, Twitter) is resolved
 * once in `@o3/content-runtime/seo`, so adding a routable type cannot accidentally ship
 * with half the tags.
 */
async function extractMetadata<Q extends string>(
  entry: BaseEntryLike<Q>,
  doc: unknown,
): Promise<Metadata> {
  // The entry's extractor accepts NonNullable<QueryResult<Q>>; the build
  // helper has only `unknown` (Q widens to string at this site). Cast to
  // satisfy the call signature — the entry's own implementation re-casts
  // back to its concrete result type.
  const documentSeo = entry.seo
    ? entry.seo(doc as NonNullable<QueryResult<Q>>)
    : defaultDocumentSeo(doc)

  const settings = await getSiteSettings()
  const seo = (doc as { seo?: SeoOverrides | null } | null)?.seo

  return buildDocumentMetadata({ seo, doc: documentSeo, settings })
}

/**
 * The derivation for an entry that declares no `seo`. It leans on the field
 * lexicon being closed (CONTEXT.md → Naming): `title` is the document's own
 * name, `excerpt` is the short summary, `heroMedia` is the lead figure, and
 * `hrefForDoc` already owns URL construction for every routable type.
 */
function defaultDocumentSeo(doc: unknown): DocumentSeo {
  const d = (doc ?? {}) as Record<string, unknown>
  return {
    title: typeof d.title === 'string' ? d.title : null,
    description: typeof d.excerpt === 'string' ? d.excerpt : null,
    image: (d.heroMedia ?? d.featuredImage ?? null) as DocumentSeo['image'],
    path: hrefForDoc({
      _type: typeof d._type === 'string' ? d._type : '',
      slug: typeof d.slug === 'string' ? d.slug : null,
    }),
  }
}

/**
 * Spread the fetched doc + route context as renderer props. The renderer's
 * prop type is `RendererProps<Q>` (doc fields + RouteContext); the helper has
 * only `unknown` at the call site (Q widens to string here). The single
 * `as any` lives in this one place so every dispatcher stays cast-free.
 */
function renderEntry(
  entry: { renderer: (props: never) => ReactNode },
  doc: unknown,
  ctx: RouteContext & Record<string, unknown>,
): JSX.Element {
  // Every entry renderer (concrete or erased) is assignable to the
  // `(props: never)` bottom; widen to a spreadable component here.
  const Renderer = entry.renderer as ComponentType<Record<string, unknown>>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props = { ...(doc as any), ...ctx }
  return <Renderer {...props} />
}

/** Build a detail-route shim for `<prefix>/[slug]/page.tsx`. */
export function buildDetailRoute<Q extends string>(entry: DetailEntry<Q>): DetailRouteShim {
  // React.cache wraps the fetcher so generateMetadata + Page share one
  // underlying sanityFetch per request. Tags follow the per-document scheme
  // so /api/revalidate can invalidate one doc without nuking the type.
  const fetchDoc = cache(async (slug: string, stega?: false) => {
    const { data } = await sanityFetch({
      query: entry.query,
      params: { slug },
      tags: [docTag(entry.type, slug), typeTag(entry.type)],
      stega,
    })
    return data
  })

  const generateMetadata: DetailRouteShim['generateMetadata'] = async ({ params }) => {
    const { slug: rawSlug } = await params
    const slug = decodePathParam(rawSlug)
    // stega: false on metadata — stega characters must never leak into
    // <title> / OG / description.
    const doc = await fetchDoc(slug, /* stega */ false)
    if (!doc) return {}
    return await extractMetadata(entry, doc)
  }

  const Page: DetailRouteShim['Page'] = async ({ params }) => {
    const { slug: rawSlug } = await params
    const slug = decodePathParam(rawSlug)
    const doc = await fetchDoc(slug)
    if (!doc) notFound()
    return renderEntry(entry, doc, { slug })
  }

  return { generateMetadata, Page }
}

/**
 * Build a catch-all-route shim for `[...segments]/page.tsx` where one or more
 * content types share the slug-from-segments dispatch. One merged GROQ query
 * matches `slug.current == segments.join('/')`; the fetched doc carries
 * `_type`, and the helper narrows on it and dispatches to the matching
 * entry's renderer. (Today `page` is the only catch-all type — the multi-type
 * dispatch shape is kept because it costs nothing and is the vtx-proven seam
 * for adding another type later.)
 */
export function buildCatchAllRoute(
  entries: readonly RoutableEntry[],
  sharedQuery: string,
): CatchAllRouteShim {
  const typeTags = entries.map((e) => typeTag(e.type))
  const entryByType = new Map<string, RoutableEntry>(entries.map((e) => [e.type, e]))

  const fetchDoc = cache(async (slug: string, stega?: false) => {
    const { data } = await sanityFetch({
      query: sharedQuery,
      params: { slug },
      tags: [...typeTags, ...entries.map((e) => docTag(e.type, slug))],
      stega,
    })
    return data
  })

  function findEntryForDoc(doc: unknown): RoutableEntry | undefined {
    if (!doc || typeof doc !== 'object') return undefined
    const type = (doc as { _type?: unknown })._type
    if (typeof type !== 'string') return undefined
    return entryByType.get(type)
  }

  /**
   * Multi-segment slugs join with `/` and carry no leading slash — the same
   * shape `page.slug.current` stores (`services/ux-audit`). `decodePathParam`
   * reconciles Next's raw-vs-decoded param asymmetry between Page and
   * generateMetadata.
   */
  function resolveSlug(segments: string[] | undefined): string {
    if (!segments || segments.length === 0) return ''
    return segments.map(decodePathParam).join('/')
  }

  const generateMetadata: CatchAllRouteShim['generateMetadata'] = async ({ params }) => {
    const { segments } = await params
    const slug = resolveSlug(segments)
    if (!slug) return {}
    const doc = await fetchDoc(slug, /* stega */ false)
    if (!doc) return {}
    const entry = findEntryForDoc(doc)
    return entry ? await extractMetadata(entry, doc) : {}
  }

  const Page: CatchAllRouteShim['Page'] = async ({ params }) => {
    const { segments } = await params
    const slug = resolveSlug(segments)
    if (!slug) notFound()
    const doc = await fetchDoc(slug)
    if (!doc) notFound()
    const entry = findEntryForDoc(doc)
    if (!entry) {
      console.error(
        `buildCatchAllRoute: unrecognized _type returned by sharedQuery; ` +
          `slug="${slug}" got=${JSON.stringify((doc as { _type?: unknown })._type)}`,
      )
      notFound()
    }
    return renderEntry(entry, doc, { slug })
  }

  return { generateMetadata, Page }
}

/**
 * Build a singleton-route shim for a fixed URL served by one document —
 * e.g. the homepage renders the `page` document whose slug is `"index"`
 * through the same entry machinery as the catch-all.
 */
export function buildSingletonRoute<Q extends string>(
  entry: SingletonEntry<Q>,
): SingletonRouteShim {
  const params = entry.params ?? {}
  const slug = params.slug ?? ''

  const fetchDoc = cache(async (stega?: false) => {
    const { data } = await sanityFetch({
      query: entry.query,
      params,
      tags: slug ? [docTag(entry.type, slug), typeTag(entry.type)] : [typeTag(entry.type)],
      stega,
    })
    return data
  })

  const generateMetadata: SingletonRouteShim['generateMetadata'] = async () => {
    const doc = await fetchDoc(/* stega */ false)
    if (!doc) return {}
    return await extractMetadata(entry, doc)
  }

  const Page: SingletonRouteShim['Page'] = async () => {
    const doc = await fetchDoc()
    if (!doc) notFound()
    return renderEntry(entry, doc, { slug })
  }

  return { generateMetadata, Page }
}

/**
 * Build a route shim for a paginated collection index (`?page=N`). The entry's query
 * returns `{ items, total }` in one round-trip (`$offset`/`$end` slice the
 * feed). The requested page is clamped against `total`; the rare
 * out-of-range request costs one refetch. Fetches are tagged per
 * `itemTypes` so an item edit invalidates the index that lists it.
 *
 * **Filtering is the same mechanism as paging** (#61): an entry declaring
 * `facets: ['category']` gets `$category` as a GROQ param and the renderer
 * gets it back as `facets.category`. The filter is therefore in the URL and
 * resolved on the server — no client state, no `use client` on the view, and a
 * filtered index is a linkable, crawlable page. It also composes with the
 * clamp for free: `total` counts the filtered feed, so `?category=design&page=9`
 * lands on the last page that category actually has.
 */
export function buildIndexRoute<Q extends string>(entry: IndexEntry<Q>): IndexRouteShim {
  const pageSize = entry.pageSize ?? 12
  const tags = entry.itemTypes.map(typeTag)
  const facetNames = entry.facets ?? []

  const fetchPage = async (page: number, facets: Facets) => {
    const { offset, end } = pageRange(page, pageSize)
    const { data } = await sanityFetch({
      query: entry.query,
      params: { offset, end, ...facets },
      tags,
    })
    return data
  }

  const generateMetadata: IndexRouteShim['generateMetadata'] = async () => {
    if (!entry.seo) return {}
    return buildDocumentMetadata({ doc: entry.seo, settings: await getSiteSettings() })
  }

  const Page: IndexRouteShim['Page'] = async ({ searchParams }) => {
    const params = await searchParams
    const requested = parsePage(params.page)
    const facets = readFacets(facetNames, params)

    let data = await fetchPage(requested, facets)
    const total = (data as { total?: unknown } | null)?.total
    const totalPages = Math.max(1, Math.ceil((typeof total === 'number' ? total : 0) / pageSize))
    const page = clampPage(requested, totalPages)
    if (page !== requested) data = await fetchPage(page, facets)
    if (!data) notFound()

    return renderEntry(entry, data, { slug: '', pagination: { page, totalPages }, facets })
  }

  return { generateMetadata, Page }
}

/**
 * The declared facets, read off the URL: first value wins where Next hands a
 * repeated parameter as an array, blank is the same as absent, and anything
 * the entry did not declare is ignored.
 *
 * **Absent is `null`, never `undefined`.** These go straight into GROQ params,
 * and an undefined variable is an error there rather than a null — so the
 * "unfiltered" arm of a query (`$category == null`) needs the value present
 * and empty, which is exactly the state a bare `/insights` is in.
 */
function readFacets(
  names: readonly string[],
  searchParams: Record<string, string | string[] | undefined>,
): Facets {
  const facets: Record<string, string | null> = {}
  for (const name of names) {
    const raw = searchParams[name]
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim()
    facets[name] = value ? value : null
  }
  return facets
}
