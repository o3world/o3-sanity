import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { PAGE_QUERY } from '@o3/sanity/queries'
import type { PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { defineCatchAllType, defineSingletonType } from '@/lib/content-routes/define'
import type { RendererProps } from '@/lib/content-routes/types'
import { getView } from '@/content/documents/registry'

type PageRendererProps = RendererProps<typeof PAGE_QUERY>

async function PageRenderer({ slug: _slug, ...rest }: PageRendererProps) {
  const doc = rest as NonNullable<PAGE_QUERY_RESULT>
  // Hoisted so PageView stays sync; the flag switches the sections array to
  // ClientBlockRenderer (Presentation optimistic reorder) in draft preview.
  const { isEnabled: isDraft } = await draftMode()
  const View = getView('page')
  return <View {...doc} isDraft={isDraft} />
}

const pageMetadata = (doc: unknown): Metadata => {
  const p = doc as NonNullable<PAGE_QUERY_RESULT>
  return {
    title: p.seo?.title ?? p.title,
    description: p.seo?.description ?? undefined,
  }
}

/** Catch-all entry: every `page` URL is its multi-segment slug (ADR 0001). */
export const page = defineCatchAllType({
  type: 'page',
  query: PAGE_QUERY,
  renderer: PageRenderer,
  metadata: pageMetadata,
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
  metadata: pageMetadata,
})
