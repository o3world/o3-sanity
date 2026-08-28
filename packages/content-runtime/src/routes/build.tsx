import { Suspense } from 'react'
import type { ComponentType, JSX, ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { currentReadMode, sanityFetch, type ReadMode } from '#live'
import { getSiteSettings } from '../siteSettings'
import { pageRange } from './pagination'
import { readIndexState } from './indexPaths'
import { atLeastOne, publishedIndexTotal, publishedSlugs } from './staticParams'
import { capToBudget, prerenderBudget } from './prerenderBudget'
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
 * They hide the cached fetch, the cache-tag wiring `/api/revalidate` relies
 * on, `_type` dispatch, and metadata extraction.
 *
 * They are also where the rendering strategy lives (#266). Every read goes
 * through `readContent` below, which is the routes' one `'use cache'`
 * boundary; everything a route does outside it — awaiting `params`, reading
 * `draftMode()` — is either known while prerendering or, in the index
 * builder's case, deliberately fenced behind Suspense so the rest of the page
 * can still be a static shell.
 *
 * The vtx-web original's i18n (locale param, fallbackOrNotFound,
 * buildAlternates), legacy path rewrites, and materialized-path matching are
 * deliberately not ported — o3 is single-locale and matches on `slug.current`.
 *
 * **No builder here turns stega on** (#229). Every read names its
 * `perspective` and `stega` through `currentReadMode`, whose published mode is
 * `stega: false` — the invisible characters reach only a draft session. See
 * the README.
 */

/**
 * The one cached read every route shares.
 *
 * `sanityFetch` calls `cacheTag()` and `cacheLife()` under Cache Components,
 * so it runs only in here. Everything the entry knows arrives as an argument
 * rather than through a closure, for two reasons: a cache key is built from
 * the arguments, and a closed-over entry would drag its renderer function
 * into a place only serializable values may go.
 *
 * Two reads that agree on all four arguments are one cache entry, which is
 * how `generateMetadata` and `Page` collapse into a single round-trip on a
 * published request.
 */
async function readContent(
  query: string,
  params: Record<string, unknown>,
  tags: string[],
  read: ReadMode,
): Promise<unknown> {
  'use cache'
  const { data } = await sanityFetch({ query, params, tags, ...read })
  return data
}

/**
 * The read a `generateMetadata` makes: whatever the request asked for, minus
 * the overlay markers. stega characters are invisible in a browser but they
 * corrupt whatever a scraper reads out of `<title>`, the description and the
 * OG tags.
 */
function metadataRead(read: ReadMode): ReadMode {
  return { ...read, stega: false }
}

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

/** The segments an index route can carry: its facet values, and its page. */
export type IndexParams = Record<string, string | string[] | undefined>

/**
 * One shim, re-exported by every route file the index owns — the bare prefix,
 * `page/[page]`, `<facet>/[<facet>]`, and the two composed. `Page` reads
 * whatever segments its own file declares, so the four files differ only in
 * which `generateStaticParams` they take.
 */
export interface IndexRouteShim {
  readonly generateMetadata: () => Promise<Metadata>
  readonly Page: (props: { params?: Promise<IndexParams> }) => JSX.Element
  /** For `<prefix>/page/[page]`. */
  readonly pageParams: () => Promise<Array<{ page: string }>>
  /** For `<prefix>/<facet>/[<facet>]`. */
  readonly facetParams: () => Promise<Array<Record<string, string>>>
  /** For `<prefix>/<facet>/[<facet>]/page/[page]`. */
  readonly facetPageParams: () => Promise<Array<Record<string, string>>>
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
  // Tags follow the per-document scheme so /api/revalidate can invalidate one
  // doc without nuking the type.
  const fetchDoc = (slug: string, read: ReadMode) =>
    readContent(entry.query, { slug }, [docTag(entry.type, slug), typeTag(entry.type)], read)

  const generateMetadata: DetailRouteShim['generateMetadata'] = async ({ params }) => {
    const { slug: rawSlug } = await params
    const slug = decodePathParam(rawSlug)
    const doc = await fetchDoc(slug, metadataRead(await currentReadMode()))
    if (!doc) return {}
    return await extractMetadata(entry, doc)
  }

  const Page: DetailRouteShim['Page'] = async ({ params }) => {
    const { slug: rawSlug } = await params
    const slug = decodePathParam(rawSlug)
    const doc = await fetchDoc(slug, await currentReadMode())
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

  const fetchDoc = (slug: string, read: ReadMode) =>
    readContent(
      sharedQuery,
      { slug },
      [...typeTags, ...entries.map((e) => docTag(e.type, slug))],
      read,
    )

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
    const doc = await fetchDoc(slug, metadataRead(await currentReadMode()))
    if (!doc) return {}
    const entry = findEntryForDoc(doc)
    return entry ? await extractMetadata(entry, doc) : {}
  }

  const Page: CatchAllRouteShim['Page'] = async ({ params }) => {
    const { segments } = await params
    const slug = resolveSlug(segments)
    if (!slug) notFound()
    const doc = await fetchDoc(slug, await currentReadMode())
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

  const fetchDoc = (read: ReadMode) =>
    readContent(
      entry.query,
      params,
      slug ? [docTag(entry.type, slug), typeTag(entry.type)] : [typeTag(entry.type)],
      read,
    )

  const generateMetadata: SingletonRouteShim['generateMetadata'] = async () => {
    const doc = await fetchDoc(metadataRead(await currentReadMode()))
    if (!doc) return {}
    return await extractMetadata(entry, doc)
  }

  const Page: SingletonRouteShim['Page'] = async () => {
    const doc = await fetchDoc(await currentReadMode())
    if (!doc) notFound()
    return renderEntry(entry, doc, { slug })
  }

  return { generateMetadata, Page }
}

/**
 * Build the route shims a paginated collection index serves from.
 *
 * The entry's query returns `{ items, total }` in one round-trip
 * (`$offset`/`$end` slice the feed); fetches are tagged per `itemTypes`, so an
 * item edit invalidates the index that lists it.
 *
 * **The state is in the path** (#370). A segment is part of the route key, so
 * `/insights/page/2` and `/insights/category/design` are routes Next
 * prerenders and the CDN holds. The scheme is `indexPaths.ts` and it is shared
 * with the views, so a chip, a pager link and `generateStaticParams` cannot
 * disagree about how this route spells itself.
 *
 * **Filtering is the same mechanism as paging** (#61): an entry declaring
 * `facets: ['category']` gets `$category` as a GROQ param, a
 * `category/[category]` segment pair, and `facets.category` back in the
 * renderer.
 *
 * **A page that does not exist is not served.** A path is a claim that a page
 * exists, so `/insights/page/900` is refused rather than answered with the
 * last page — which would give that page a second address.
 *
 * The STATUS is the one thing the boundary costs. `notFound()` is called inside
 * it, so a page that was prerendered answers 404 and one rendered on demand has
 * already flushed its shell with a 200 and streams the not-found body into it.
 * That is the same trade the dataset-unreadable case below makes, and it is the
 * price of the hole: reading the segments above the boundary would make the
 * shell itself dynamic, which is the property this route exists to keep.
 */
export function buildIndexRoute<Q extends string>(entry: IndexEntry<Q>): IndexRouteShim {
  const pageSize = entry.pageSize ?? 12
  const tags = entry.itemTypes.map(typeTag)
  const facetNames = entry.facets ?? []

  const fetchPage = (page: number, facets: Facets, read: ReadMode) => {
    const { offset, end } = pageRange(page, pageSize)
    return readContent(entry.query, { offset, end, ...facets }, tags, read)
  }

  /**
   * The authored chrome, or `null` where the entry declares none.
   *
   * TYPE-TAGGED ONLY, and that is the whole of it. The webhook builds a
   * per-document tag from `slug.current` and this document deliberately has no
   * slug, so a `sanity:<type>:<key>` tag registered here could never be
   * revalidated by anything — it would read as a narrower invalidation than
   * the route actually has. One collection's chrome publishing therefore
   * flushes both indexes, which is a wasted regeneration of one page and not a
   * correctness problem.
   */
  const fetchDocument = async (read: ReadMode): Promise<unknown> => {
    const doc = entry.document
    if (!doc) return null
    return (await readContent(doc.query, doc.params ?? {}, [typeTag(doc.type)], read)) ?? null
  }

  /**
   * Three tiers (#26, #349): the document's own `seo` overrides win, the
   * entry's static SEO is the fallback, and Site Settings is the floor.
   *
   * `path` is the ENTRY's throughout, never the document's — the route owns
   * the URL, so the canonical is the route's fact. It is what keeps
   * `/insights/page/2` and `/insights/category/design` canonicalizing to the
   * unpaginated index rather than being indexed as documents of their own, and
   * it means no value an editor can type moves the page.
   */
  const generateMetadata: IndexRouteShim['generateMetadata'] = async () => {
    const read = metadataRead(await currentReadMode())
    const doc = await fetchDocument(read)
    const authored = (doc as { seo?: SeoOverrides | null } | null)?.seo

    /**
     * No static SEO means no `path`, and `path` is the only thing a canonical
     * can be built from here — an empty one resolves to the bare origin, so
     * every page of the index would claim the homepage as its canonical.
     * Emitting nothing is strictly better than emitting that.
     *
     * `defineIndexType` makes this unreachable for an entry with a `document`.
     * It stays because the type only guards the construction site.
     */
    if (!entry.seo) return {}

    /**
     * Every override an index honours EXCEPT `canonical`.
     *
     * A detail page may point its canonical elsewhere — that is what the field
     * is for, and `buildDocumentMetadata` obeys it. An index may not. This
     * route canonicalizes every paginated and filtered page back to the bare
     * index, so one editor-typed URL would redirect the whole collection's
     * crawl at once, and the value that decides it is the route's `path`
     * rather than anything in the dataset.
     *
     * Dropped rather than gated in the schema: `seo` is one shared object on
     * every document, and forking it per type to hide one field would cost
     * more than this line.
     */
    const seo = authored ? { ...authored, canonical: null } : authored

    return buildDocumentMetadata({
      seo,
      doc: entry.seo,
      settings: await getSiteSettings(),
    })
  }

  /**
   * The feed, behind the Suspense boundary.
   *
   * Its input is `params`, so a prerendered page of the collection is a static
   * shell the CDN serves. A page nobody enumerated renders on demand once and
   * is cached from then on, and the boundary is what that once streams into.
   */
  const Feed = async ({ params }: { params?: Promise<IndexParams> }) => {
    const state = readIndexState(facetNames, (await params) ?? {})
    // Not a page: `page/0`, `page/two`, and `page/1`, which is the bare index
    // wearing a second URL.
    if (!state) notFound()
    const read = await currentReadMode()

    const [data, document] = await Promise.all([
      fetchPage(state.page, state.facets, read),
      fetchDocument(read),
    ])
    // Inside the boundary, so the shell has already flushed with a 200: an
    // index whose dataset is unreadable renders the 404 body without the 404
    // status a detail route would send. It is the accepted cost of the hole.
    if (!data) notFound()

    const total = (data as { total?: unknown } | null)?.total
    const count = typeof total === 'number' ? total : 0
    // A cut of the collection with nothing in it is not a page. The chips only
    // offer facet values that have items, so an empty cut means a value the
    // collection does not have — `/insights/category/anything-at-all`, which is
    // an unbounded space of URLs a crawler would otherwise be handed 200s for.
    // An empty collection, unfiltered, is a real page and keeps its empty state.
    if (count === 0 && Object.values(state.facets).some(Boolean)) notFound()

    const totalPages = Math.max(1, Math.ceil(count / pageSize))
    if (state.page > totalPages) notFound()

    return renderEntry(entry, data, {
      slug: '',
      pagination: { page: state.page, totalPages },
      facets: state.facets,
      document,
    })
  }

  /**
   * The authored bands around the feed, rendered outside the boundary. Reads
   * only prerender-safe things — `draftMode()` through `currentReadMode`, and
   * the cached document — so on a published request this is part of the
   * static shell: the hero is real from the first byte instead of a
   * guessed-height stand-in that shifts the page when the feed lands. The
   * feed's own document read agrees on every argument, so the two are one
   * cache entry.
   */
  const Chrome = async ({ slot }: { slot: 'above' | 'below' }) => {
    if (!entry.chrome) return null
    const document = await fetchDocument(await currentReadMode())
    return <>{entry.chrome({ document, slot })}</>
  }

  const Page: IndexRouteShim['Page'] = ({ params }) => (
    <>
      <Chrome slot="above" />
      {/* The entry's own picture of its feed, or nothing where it declares
          none — in which case the hole is whatever the layout's `<main>`
          paints until the feed arrives on the same response. */}
      <Suspense fallback={entry.fallback ?? null}>
        <Feed params={params} />
      </Suspense>
      <Chrome slot="below" />
    </>
  )

  /**
   * The one facet a path can carry a segment pair for.
   *
   * Both indexes that filter declare exactly one, and the scheme in
   * `indexPaths.ts` composes any number of them into a path. What has no
   * answer is how many of the CROSS-PRODUCT to prerender, which is a decision
   * about how many URLs a collection should have rather than a line of code —
   * so a second facet stops here rather than quietly enumerating one axis.
   */
  const soleFacet = (): string => {
    const [name, ...rest] = facetNames
    if (!name || rest.length > 0) {
      throw new Error(
        `buildIndexRoute: facet paths need exactly one declared facet, got ${facetNames.length}`,
      )
    }
    return name
  }

  /** Every page after the first, capped by the build's prerender budget. */
  const pagesAfterFirst = async (facets: Facets): Promise<string[]> => {
    const total = await publishedIndexTotal(entry.query, facets)
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const pages = Array.from({ length: totalPages - 1 }, (_, index) => String(index + 2))
    return capToBudget(pages, prerenderBudget())
  }

  const emptyFacets = (): Facets =>
    Object.fromEntries(facetNames.map((name) => [name, null])) as Facets

  const pageParams: IndexRouteShim['pageParams'] = async () => {
    const pages = await pagesAfterFirst(emptyFacets())
    return atLeastOne(
      pages.map((page) => ({ page })),
      { page: '2' },
    )
  }

  const facetParams: IndexRouteShim['facetParams'] = async () => {
    const name = soleFacet()
    const query = entry.facetValues?.[name]
    if (!query) throw new Error(`buildIndexRoute: no facetValues query declared for "${name}"`)
    const values = await publishedSlugs(query)
    return atLeastOne(
      values.map((value) => ({ [name]: value })),
      { [name]: 'none' },
    )
  }

  const facetPageParams: IndexRouteShim['facetPageParams'] = async () => {
    const name = soleFacet()
    const query = entry.facetValues?.[name]
    if (!query) throw new Error(`buildIndexRoute: no facetValues query declared for "${name}"`)
    const values = await publishedSlugs(query)
    const params: Array<Record<string, string>> = []
    for (const value of values) {
      for (const page of await pagesAfterFirst({ [name]: value } as Facets)) {
        params.push({ [name]: value, page })
      }
    }
    return atLeastOne(params, { [name]: 'none', page: '2' })
  }

  return { generateMetadata, Page, pageParams, facetParams, facetPageParams }
}
