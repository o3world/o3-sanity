import {
  COLLECTION_INDEX_QUERY,
  INSIGHT_CATEGORY_SLUGS_QUERY,
  INSIGHTS_PAGE_QUERY,
} from '@o3/sanity/queries'
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

/**
 * One slot's worth of authored bands, or nothing where the array is empty —
 * which is also what a dataset with no chrome document renders. `Blocks`
 * resolves draft mode itself, so the Presentation path comes with it.
 *
 * An entry `chrome`, not part of the renderer: these bands depend on the
 * document alone, so the route draws them outside the feed's Suspense
 * boundary and they prerender into the shell — the hero is real from the
 * first byte rather than a stand-in the arriving feed replaces at a
 * different height.
 */
function InsightIndexChrome({ document, slot }: { document: unknown; slot: 'above' | 'below' }) {
  const chrome = document as COLLECTION_INDEX_QUERY_RESULT
  const field = slot === 'above' ? 'sectionsAbove' : 'sectionsBelow'
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
 * The paginated, filterable /insights index (12/page).
 *
 * **The page is two halves.** The feed — chips, grid, pager — is the route's,
 * because a page is one path per document and a paginated listing
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
  // The slugs `/insights/category/[category]` prerenders (#370).
  facetValues: { category: INSIGHT_CATEGORY_SLUGS_QUERY },
  document: {
    type: 'collectionIndex',
    query: COLLECTION_INDEX_QUERY,
    params: { collection: 'insight' },
  },
  chrome: InsightIndexChrome,
  renderer: InsightIndexRenderer,
  fallback: <InsightIndexSkeleton />,
  seo: {
    title: 'Insights',
    description: 'Notes from inside the work — what we tried, and what broke.',
    // Paginated and filtered pages canonicalize to the unpaginated index:
    // `/insights/page/2` and `/insights/category/design` are the same
    // collection, not further documents.
    path: collectionPrefixes().insight,
  },
  // The Insights index frame #61 commissioned — hero `2336:4477`, filter bar
  // `2337:4486`, grid `2337:4492`, CTA `2336:4351`.
  migration: { figmaNode: '2336:4310' },
})
