import { INSIGHTS_PAGE_QUERY } from '@o3/sanity/queries'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import type { INSIGHTS_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { InsightIndexView } from './InsightIndexView'
import { defineIndexType } from '@/lib/content-routes/define'
import type { IndexRendererProps } from '@/lib/content-routes/types'

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
 * The paginated /insights index (12/page). Unlike vtx listings there is
 * no backing singleton document — the query returns `{items, total,
 * categories}` and metadata is static.
 *
 * **No longer provisional (#61).** `2336:4310` is the frame that ticket
 * commissioned, ruled canonical 2026-08-13: it settles the composition the
 * route used to borrow, writes the hero standfirst that traced to nothing,
 * and answers the open question #49 left — the index filters by category, and
 * the filter is a chip bar. The pager is the one element it does not draw;
 * `InsightIndexView` says why it stays.
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
    title: 'Insights',
    description: 'Notes from inside the work — what we tried, and what broke.',
    // Paginated and filtered pages canonicalize to the unpaginated index:
    // `?page=2` and `?category=design` are the same collection, not further
    // documents.
    path: COLLECTION_PREFIXES.insight,
  },
  // The Insights index frame #61 commissioned — hero `2336:4477`, filter bar
  // `2337:4486`, grid `2337:4492`, CTA `2336:4351`.
  migration: { figmaNode: '2336:4310' },
})
