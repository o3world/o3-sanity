import { INSIGHTS_PAGE_QUERY } from '@o3/sanity/queries'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import type { INSIGHTS_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { InsightIndexView } from './InsightIndexView'
import { defineIndexType } from '@/lib/content-routes/define'
import type { IndexRendererProps } from '@/lib/content-routes/types'

type Props = IndexRendererProps<typeof INSIGHTS_PAGE_QUERY>

function InsightIndexRenderer({ pagination, ...rest }: Props) {
  // Q widens to string at this site (TS#33304); cast back to the typed
  // query result for the view.
  const data = rest as unknown as NonNullable<INSIGHTS_PAGE_QUERY_RESULT>
  return <InsightIndexView items={data.items} pagination={pagination} />
}

/**
 * The paginated /insights index (12/page). Unlike vtx listings there is
 * no backing singleton document — the query returns `{items, total}` and
 * metadata is static.
 *
 * **Provisional (#49).** 272 migrated articles sit behind a top-level nav
 * link, and no canonical frame draws the index — the largest coverage gap on
 * map #33. The composition borrows treatments that *are* drawn rather than
 * inventing one; what each element traces to, and the three things that trace
 * to nothing, are itemised on `InsightIndexView`.
 */
export const insightIndex = defineIndexType({
  itemTypes: ['insight'],
  query: INSIGHTS_PAGE_QUERY,
  pageSize: 12,
  renderer: InsightIndexRenderer,
  seo: {
    title: 'Insights',
    description: 'Notes from inside the work — what we tried, and what broke.',
    // Paginated pages canonicalize to the unpaginated index: `?page=2` is
    // the same collection, not a second document.
    path: COLLECTION_PREFIXES.insight,
  },
  migration: {
    provisional: true,
    provisionalNote:
      'No canonical frame draws the /insights index (#49). The hero band, ' +
      'the card and the bone grid are borrowed from frames that do draw them ' +
      '(1634:1181, 1683:2467, 1924:5388); the hero standfirst, the stacked-row ' +
      'gap above 402 and the whole pager are unsourced. Cleared by a ' +
      'commissioned index frame — and note that a frame may also settle the ' +
      'category filter this build declines to invent (11 categories exist, no ' +
      'frame shows a filter UI).',
  },
})
