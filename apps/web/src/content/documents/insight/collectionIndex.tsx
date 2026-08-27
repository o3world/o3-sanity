import { COLLECTION_INDEX_QUERY, INSIGHTS_PAGE_QUERY } from '@o3/sanity/queries'
import { collectionPrefixes } from '@o3/sanity/brand'
import type {
  COLLECTION_INDEX_QUERY_RESULT,
  INSIGHTS_PAGE_QUERY_RESULT,
} from '@o3/sanity/types/generated'

import { defineIndexType, type IndexRendererProps } from '@o3/content-runtime/routes'

import { Blocks } from '@/content/blocks/Blocks'

import { InsightIndexSkeleton } from './InsightIndexSkeleton'
import { InsightIndexView } from './InsightIndexView'

type Props = IndexRendererProps<typeof INSIGHTS_PAGE_QUERY>

function InsightIndexRenderer({ pagination, facets, document, ...rest }: Props) {
  // Q widens to string at this site (TS#33304); cast back to the typed
  // query result for the view. The chrome document arrives as `unknown` for
  // the same reason and is cast in the same breath.
  const data = rest as unknown as NonNullable<INSIGHTS_PAGE_QUERY_RESULT>
  const chrome = document as COLLECTION_INDEX_QUERY_RESULT

  /**
   * One slot's worth of authored bands, or nothing where the array is empty —
   * which is also what a dataset with no chrome document renders. `Blocks`
   * resolves draft mode itself, so the Presentation path comes with it.
   */
  const bands = (field: 'sectionsAbove' | 'sectionsBelow') => {
    const blocks = chrome?.[field] ?? []
    if (!chrome || blocks.length === 0) return null
    return (
      <Blocks
        blocks={blocks}
        documentId={chrome._id}
        documentType="collectionIndex"
        fieldPath={field}
      />
    )
  }

  return (
    <InsightIndexView
      items={data.items}
      categories={data.categories}
      category={facets.category ?? null}
      pagination={pagination}
      above={bands('sectionsAbove')}
      below={bands('sectionsBelow')}
    />
  )
}

/**
 * The paginated, filterable /insights index (12/page).
 *
 * **The page is two halves.** The feed — chips, grid, pager — is the route's,
 * because `?page=` is one parameter per document and a paginated listing
 * cannot be a block someone drops twice. Everything around it is the
 * `collectionIndex` document this entry fetches beside the feed (#347), so the
 * hero and the closer are an editor's rather than this file's.
 *
 * The one facet is `category`, matched by slug so the state lives in the URL.
 */
export const insightIndex = defineIndexType({
  itemTypes: ['insight'],
  query: INSIGHTS_PAGE_QUERY,
  pageSize: 12,
  facets: ['category'],
  document: {
    type: 'collectionIndex',
    query: COLLECTION_INDEX_QUERY,
    params: { collection: 'insight' },
  },
  renderer: InsightIndexRenderer,
  fallback: <InsightIndexSkeleton />,
  seo: {
    title: 'Insights',
    description: 'Notes from inside the work — what we tried, and what broke.',
    // Paginated and filtered pages canonicalize to the unpaginated index:
    // `?page=2` and `?category=design` are the same collection, not further
    // documents.
    path: collectionPrefixes().insight,
  },
  // The Insights index frame #61 commissioned — hero `2336:4477`, filter bar
  // `2337:4486`, grid `2337:4492`, CTA `2336:4351`.
  migration: { figmaNode: '2336:4310' },
})
