import { PAGE_QUERY } from '@o3/sanity/queries'
import type { PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import {
  defineCatchAllType,
  defineSingletonType,
  type RendererProps,
} from '@o3/content-runtime/routes'
import type { DocumentSeo } from '@o3/content-runtime/seo'
import { hrefForDoc } from '@o3/content-runtime/urls'

import { getView } from '@/content/documents/registry'

type PageRendererProps = RendererProps<typeof PAGE_QUERY>

function PageRenderer({ slug: _slug, ...rest }: PageRendererProps) {
  const doc = rest as NonNullable<PAGE_QUERY_RESULT>
  const View = getView('page')
  return <View {...doc} />
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
