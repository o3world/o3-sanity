import { PERSPECTIVE_QUERY } from '@o3/sanity/queries'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import type { PERSPECTIVE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { defineDetailType } from '@/lib/content-routes/define'
import type { RendererProps } from '@/lib/content-routes/types'
import type { DocumentSeo } from '@/lib/seo'
import { getView } from '@/content/documents/registry'

type PerspectiveRendererProps = RendererProps<typeof PERSPECTIVE_QUERY>

function PerspectiveRenderer({ slug: _slug, ...rest }: PerspectiveRendererProps) {
  // The cast bridges the Q-widening gap (see content-routes/types.ts) — the
  // runtime shape is always the typed query result.
  const doc = rest as NonNullable<PERSPECTIVE_QUERY_RESULT>
  const View = getView('perspective')
  return <View {...doc} />
}

export const perspective = defineDetailType({
  type: 'perspective',
  urlPrefix: COLLECTION_PREFIXES.perspective,
  query: PERSPECTIVE_QUERY,
  renderer: PerspectiveRenderer,
  // Only the document-shaped half — the override chain, canonical, robots
  // and social tags are the shared job of `@/lib/seo` (#26).
  seo: (doc): DocumentSeo => {
    const p = doc as NonNullable<PERSPECTIVE_QUERY_RESULT>
    return {
      title: p.title,
      description: p.excerpt,
      // CONTEXT.md → Known drift: this field should be `heroMedia`.
      image: p.featuredImage,
      path: `${COLLECTION_PREFIXES.perspective}/${p.slug}`,
      ogType: 'article',
      publishedTime: p.publishedAt,
    }
  },
})
