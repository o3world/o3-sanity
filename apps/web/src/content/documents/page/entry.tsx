import { PAGE_QUERY } from '@o3/sanity/queries'
import type { PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import {
  defineCatchAllType,
  defineSingletonType,
  type RendererProps,
} from '@o3/content-runtime/routes'
import { getBaseUrl } from '@o3/content-runtime/base-url'
import { stegaClean } from '@sanity/client/stega'
import type { DocumentSeo } from '@o3/content-runtime/seo'
import { hrefForDoc } from '@o3/content-runtime/urls'

import { getView } from '@/content/documents/registry'
import { JsonLd, OrganizationJsonLd } from '@/content/structuredData/JsonLd'
import { breadcrumbs, service } from '@/content/structuredData/schema'

type PageRendererProps = RendererProps<typeof PAGE_QUERY>

/**
 * A page that sells a service: the editor typed it `service` or `partner`.
 * Cleaned first, because a draft read stega-encodes the value.
 */
function isServicePage(doc: NonNullable<PAGE_QUERY_RESULT>): boolean {
  const type = stegaClean(doc.pageType)
  return type === 'service' || type === 'partner'
}

/**
 * Organization on the homepage; a breadcrumb trail, and a Service where it
 * applies, everywhere else. `slug` is the route's: the renderer's props carry
 * the route context's `slug` in place of the document's.
 */
function PageStructuredData({ doc, slug }: { doc: NonNullable<PAGE_QUERY_RESULT>; slug: string }) {
  if (slug === 'index') return <OrganizationJsonLd />

  const baseUrl = getBaseUrl()
  const path = hrefForDoc({ _type: 'page', slug })
  const title = doc.title ?? ''
  const parentSlug = stegaClean(doc.parent?.slug)
  const parent = parentSlug
    ? [{ name: doc.parent?.title ?? '', path: hrefForDoc({ _type: 'page', slug: parentSlug }) }]
    : []

  return (
    <>
      <JsonLd data={breadcrumbs(baseUrl, [...parent, { name: title, path }])} />
      {isServicePage(doc) ? (
        <JsonLd data={service({ baseUrl, name: title, description: doc.seo?.description, path })} />
      ) : null}
    </>
  )
}

function PageRenderer({ slug, ...rest }: PageRendererProps) {
  const doc = rest as NonNullable<PAGE_QUERY_RESULT>
  const View = getView('page')
  return (
    <>
      <PageStructuredData doc={doc} slug={slug} />
      <View {...doc} />
    </>
  )
}

/**
 * A page has no excerpt to fall back on, so its description comes from
 * `seo.description` or Site Settings — the shared chain handles both. Multi-
 * segment slugs already carry their own prefix; `hrefForDoc` owns the one
 * exception (`index` → `/`).
 */
const pageSeo = (doc: unknown): DocumentSeo => {
  const p = doc as NonNullable<PAGE_QUERY_RESULT>
  return { title: p.title, path: hrefForDoc({ _type: 'page', slug: p.slug }) }
}

/** Catch-all entry: every `page` URL is its multi-segment slug (ADR 0001). */
export const page = defineCatchAllType({
  type: 'page',
  query: PAGE_QUERY,
  renderer: PageRenderer,
  seo: pageSeo,
})

/**
 * The homepage is the `page` document with slug `"index"`, served at `/`
 * through the singleton builder with the same renderer + metadata.
 */
export const home = defineSingletonType({
  type: 'page',
  query: PAGE_QUERY,
  params: { slug: 'index' },
  renderer: PageRenderer,
  seo: pageSeo,
})
