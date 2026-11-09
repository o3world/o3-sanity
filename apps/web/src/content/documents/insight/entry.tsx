import { INSIGHT_QUERY } from '@o3/sanity/queries'
import { collectionPrefixes } from '@o3/sanity/brand'
import type { INSIGHT_QUERY_RESULT } from '@o3/sanity/types/generated'

import { stegaClean } from '@sanity/client/stega'

import { absoluteUrl, getBaseUrl } from '@o3/content-runtime/base-url'
import { defineDetailType, type RendererProps } from '@o3/content-runtime/routes'
import { socialImageUrl, type DocumentSeo } from '@o3/content-runtime/seo'
import { getSiteSettings } from '@o3/content-runtime/site-settings'

import { getView } from '@/content/documents/registry'
import { JsonLd } from '@/content/structuredData/JsonLd'
import { blogPosting, breadcrumbs } from '@/content/structuredData/schema'

import { insightIndex } from './collectionIndex'

type InsightRendererProps = RendererProps<typeof INSIGHT_QUERY>

type Insight = NonNullable<INSIGHT_QUERY_RESULT>

/**
 * The BlogPosting, with the share card's image resolved as `og:image` is: the
 * `seo` override, then the card picture, then the Site Settings default.
 */
async function BlogPostingJsonLd({ doc, url }: { doc: Insight; url: string }) {
  const settings = await getSiteSettings()
  const imageUrl =
    socialImageUrl(doc.seo?.ogImage) ??
    socialImageUrl(doc.cardMedia) ??
    socialImageUrl(settings?.defaultSeo?.ogImage)
  return <JsonLd data={blogPosting({ baseUrl: getBaseUrl(), insight: doc, url, imageUrl })} />
}

function InsightRenderer({ slug, ...rest }: InsightRendererProps) {
  // The cast bridges the Q-widening gap (see `@o3/content-runtime/routes`) — the
  // runtime shape is always the typed query result.
  const doc = rest as Insight
  const View = getView('insight')
  const baseUrl = getBaseUrl()
  const prefix = collectionPrefixes().insight
  // The canonical tag's URL: an editor's override, else this route.
  const url = stegaClean(doc.seo?.canonical)?.trim() || absoluteUrl(`${prefix}/${slug}`, baseUrl)
  return (
    <>
      <BlogPostingJsonLd doc={doc} url={url} />
      <JsonLd
        data={breadcrumbs(baseUrl, [
          { name: insightIndex.seo?.title ?? 'Insights', path: prefix },
          { name: doc.title ?? '', path: `${prefix}/${slug}` },
        ])}
      />
      <View {...doc} />
    </>
  )
}

export const insight = defineDetailType({
  type: 'insight',
  urlPrefix: collectionPrefixes().insight,
  query: INSIGHT_QUERY,
  renderer: InsightRenderer,
  // Only the document-shaped half — the override chain, canonical, robots
  // and social tags are the shared job of `@o3/content-runtime/seo` (#26).
  seo: (doc): DocumentSeo => {
    const p = doc as NonNullable<INSIGHT_QUERY_RESULT>
    return {
      title: p.title,
      description: p.excerpt,
      // The share preview follows the card chain: a card picture is chosen to
      // represent the document in a small frame, which is the crop a social
      // card takes. `cardMedia` arrives already falling back to the hero.
      image: p.cardMedia,
      path: `${collectionPrefixes().insight}/${p.slug}`,
      ogType: 'article',
      publishedTime: p.publishedAt,
    }
  },
})
