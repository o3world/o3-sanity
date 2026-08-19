import { CASE_STUDIES_PAGE_QUERY } from '@o3/sanity/queries'
import { brandConfig } from '@o3/sanity/brand'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import type { CASE_STUDIES_PAGE_QUERY_RESULT } from '@o3/sanity/types/generated'

import { defineIndexType, type IndexRendererProps } from '@o3/content-runtime/routes'

import { CaseStudyIndexView } from './CaseStudyIndexView'

type Props = IndexRendererProps<typeof CASE_STUDIES_PAGE_QUERY>

function CaseStudyIndexRenderer({ pagination, ...rest }: Props) {
  // Q widens to string at this site (TS#33304); cast back to the typed
  // query result for the view.
  const data = rest as unknown as NonNullable<CASE_STUDIES_PAGE_QUERY_RESULT>
  return <CaseStudyIndexView items={data.items} pagination={pagination} />
}

/**
 * The case-study index, at this brand's prefix (`/case-studies`) and under this
 * brand's name — both read off brand config rather than written here, which is
 * the whole difference between this file and apps/web's (ADR 0028).
 *
 * **Nine per page**, the same figure apps/web uses: the cards are full-width
 * bands rather than a three-up grid, so a page of twelve is roughly 7000px of
 * scrolling.
 */
export const caseStudyIndex = defineIndexType({
  itemTypes: ['caseStudy'],
  query: CASE_STUDIES_PAGE_QUERY,
  pageSize: 9,
  renderer: CaseStudyIndexRenderer,
  seo: {
    title: brandConfig().collections.caseStudy.title,
    // Paginated pages canonicalize to the unpaginated index.
    path: COLLECTION_PREFIXES.caseStudy,
  },
  migration: {
    provisional: true,
    provisionalNote:
      'Composition is O3’s canonical Work frame (1634:1167), which the adaptation experiment borrows deliberately (ADR 0028 addendum) — the copy is not. This index has no document, so its hero copy lives in the view, and it holds a placeholder heading until O3XO’s own case-study content and the delta evaluation say what belongs there.',
  },
})
