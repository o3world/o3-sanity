import { INSIGHT_QUERY } from '@o3/sanity/queries'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import type { INSIGHT_QUERY_RESULT } from '@o3/sanity/types/generated'

import { defineDetailType } from '@/lib/content-routes/define'
import type { RendererProps } from '@/lib/content-routes/types'
import type { DocumentSeo } from '@/lib/seo'
import { getView } from '@/content/documents/registry'

type InsightRendererProps = RendererProps<typeof INSIGHT_QUERY>

function InsightRenderer({ slug: _slug, ...rest }: InsightRendererProps) {
  // The cast bridges the Q-widening gap (see content-routes/types.ts) — the
  // runtime shape is always the typed query result.
  const doc = rest as NonNullable<INSIGHT_QUERY_RESULT>
  const View = getView('insight')
  return <View {...doc} />
}

export const insight = defineDetailType({
  type: 'insight',
  urlPrefix: COLLECTION_PREFIXES.insight,
  query: INSIGHT_QUERY,
  renderer: InsightRenderer,
  // Only the document-shaped half — the override chain, canonical, robots
  // and social tags are the shared job of `@/lib/seo` (#26).
  seo: (doc): DocumentSeo => {
    const p = doc as NonNullable<INSIGHT_QUERY_RESULT>
    return {
      title: p.title,
      description: p.excerpt,
      // CONTEXT.md → Known drift: this field should be `heroMedia`.
      image: p.featuredImage,
      path: `${COLLECTION_PREFIXES.insight}/${p.slug}`,
      ogType: 'article',
      publishedTime: p.publishedAt,
    }
  },
})
