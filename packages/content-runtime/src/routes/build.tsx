import { Suspense } from 'react'
import type { ComponentType, JSX, ReactNode } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { currentReadMode, sanityFetch, type ReadMode } from '#live'
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

export interface IndexRouteShim {
  readonly generateMetadata: () => Promise<Metadata>
  readonly Page: (props: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
  }) => JSX.Element
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
   * the URL, so the canonical is the route's fact. It is what keeps `?page=2`
   * and `?category=design` canonicalizing to the unpaginated index rather than
   * being indexed as documents of their own, and it means no value an editor
   * can type moves the page.
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
   * The whole of an index is downstream of `?page=` and `?category=`, so the
   * feed is the route's dynamic hole: it reads `searchParams`, and everything
   * above the boundary — the chrome the `(site)` layout draws — prerenders
   * into the shell the CDN serves. The feed itself is still a cached read, so
   * a second visitor to the same page pays no Sanity request for it.
   */
  const Feed = async ({
    searchParams,
  }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>
  }) => {
    const params = await searchParams
    const requested = parsePage(params.page)
    const facets = readFacets(facetNames, params)
    const read = await currentReadMode()

    const [initial, document] = await Promise.all([
      fetchPage(requested, facets, read),
      fetchDocument(read),
    ])
    let data = initial
    const total = (data as { total?: unknown } | null)?.total
    const totalPages = Math.max(1, Math.ceil((typeof total === 'number' ? total : 0) / pageSize))
    const page = clampPage(requested, totalPages)
    if (page !== requested) data = await fetchPage(page, facets, read)
    // Inside the boundary, so the shell has already flushed with a 200: an
    // index whose dataset is unreadable renders the 404 body without the 404
    // status a detail route would send. It is the accepted cost of the hole.
    if (!data) notFound()

    return renderEntry(entry, data, {
      slug: '',
      pagination: { page, totalPages },
      facets,
      document,
    })
  }

  const Page: IndexRouteShim['Page'] = ({ searchParams }) => (
    // No fallback to draw: the layout's `<main>` already holds the page's
    // height open, and the feed arrives on the same response.
    <Suspense fallback={null}>
      <Feed searchParams={searchParams} />
    </Suspense>
  )

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
