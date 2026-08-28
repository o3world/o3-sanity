import { INSIGHT_CATEGORY_SLUGS_QUERY, INSIGHTS_PAGE_QUERY } from '@o3/sanity/queries'
import { brandConfig } from '@o3/sanity/brand'
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
  // The slugs `/insights/category/[category]` prerenders (#370).
  facetValues: { category: INSIGHT_CATEGORY_SLUGS_QUERY },
  renderer: InsightIndexRenderer,
  seo: {
    title: brandConfig().collections.insight.title,
    // o3xo.ai's own meta description for this URL, migrated with the collection.
    description:
      'Explore practical perspectives on AI strategy, industry-specific use cases, adoption challenges, and achieving measurable ROI from AI investments.',
    // Paginated and filtered pages canonicalize to the unpaginated index:
    // `/insights/page/2` and `/insights/category/design` are the same
    // collection, not further documents.
    path: brandConfig().collections.insight.prefix,
  },
  // O3's canonical Insights frame, borrowed deliberately (ADR 0028 addendum) —
  // this brand has no frame of its own and the adaptation experiment is the
  // point. No longer provisional (#218): the collection it was waiting for is
  // migrated, and the hero copy is o3xo.ai's own (`InsightIndexView`).
  migration: { figmaNode: '2336:4310' },
})
