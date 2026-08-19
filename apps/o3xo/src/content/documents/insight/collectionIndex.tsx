import { INSIGHTS_PAGE_QUERY } from '@o3/sanity/queries'
import { brandConfig } from '@o3/sanity/brand'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import type { INSIGHTS_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { defineIndexType, type IndexRendererProps } from '@o3/content-runtime/routes'

import { InsightIndexView } from './InsightIndexView'

type Props = IndexRendererProps<typeof INSIGHTS_PAGE_QUERY>

function InsightIndexRenderer({ pagination, facets, ...rest }: Props) {
  // Q widens to string at this site (TS#33304); cast back to the typed
  // query result for the view.
  const data = rest as unknown as NonNullable<INSIGHTS_PAGE_QUERY_RESULT>
  return (
    <InsightIndexView
      items={data.items}
      categories={data.categories}
      category={facets.category ?? null}
      pagination={pagination}
    />
  )
}

/**
 * The paginated insights index (12/page). Both brands serve `/insights`, and it
 * still comes from brand config rather than a literal — a shared prefix is a
 * fact that happens to agree today, not a constant.
 *
 * The one facet is `category`, matched by slug so the state lives in the URL.
 */
export const insightIndex = defineIndexType({
  itemTypes: ['insight'],
  query: INSIGHTS_PAGE_QUERY,
  pageSize: 12,
  facets: ['category'],
  renderer: InsightIndexRenderer,
  seo: {
    title: brandConfig().collections.insight.title,
    // Paginated and filtered pages canonicalize to the unpaginated index:
    // `?page=2` and `?category=design` are the same collection, not further
    // documents.
    path: COLLECTION_PREFIXES.insight,
  },
  migration: {
    provisional: true,
    provisionalNote:
      'Composition is O3’s canonical Insights frame (2336:4310), borrowed deliberately (ADR 0028 addendum); the hero copy in the view is a placeholder. Cleared when O3XO’s 41 insights land (#218) and the delta evaluation settles this index’s copy.',
  },
})
