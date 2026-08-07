import { CASE_STUDIES_PAGE_QUERY } from '@o3/sanity/queries'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import type { CASE_STUDIES_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { CaseStudyIndexView } from './CaseStudyIndexView'
import { defineIndexType } from '@/lib/content-routes/define'
import type { IndexRendererProps } from '@/lib/content-routes/types'

type Props = IndexRendererProps<typeof CASE_STUDIES_PAGE_QUERY>

function CaseStudyIndexRenderer({ pagination, ...rest }: Props) {
  // Q widens to string at this site (TS#33304); cast back to the typed
  // query result for the view.
  const data = rest as unknown as NonNullable<CASE_STUDIES_PAGE_QUERY_RESULT>
  return <CaseStudyIndexView items={data.items} pagination={pagination} />
}

/**
 * The /work index — #43. Same shape as `insightIndex`: no backing
 * document, `{items, total}` from the query, static metadata.
 *
 * **Nine per page**, not twelve. The cards are full-width 1248 × 556 bands
 * rather than a three-up grid, so a page of twelve is roughly 7000px of
 * scrolling. Nine is three screens' worth at the frame's card height.
 */
export const caseStudyIndex = defineIndexType({
  itemTypes: ['caseStudy'],
  query: CASE_STUDIES_PAGE_QUERY,
  pageSize: 9,
  renderer: CaseStudyIndexRenderer,
  seo: {
    title: 'Work',
    description:
      'The work, framed around the second problem — the deeper one we found, not the deliverable.',
    // Paginated pages canonicalize to the unpaginated index.
    path: COLLECTION_PREFIXES.caseStudy,
  },
  // The Work frame — hero `1634:1181`, grid `1634:1186`, mobile `1906:851`.
  // Recorded here so the two collection indexes state their provenance the
  // same way, and so "/insights is provisional" reads as a difference
  // between them rather than as the norm (#49).
  migration: { figmaNode: '1634:1167' },
})
