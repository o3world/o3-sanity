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
 * **Nine per page**, the same figure apps/web uses: the kit's cards run three
 * across (`4404:3398`), and nine of them is three whole rows.
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
      'The cards and their row are the kit’s (4404:3072, 4404:3398). The band above them is not: the kit draws no case-studies page, so the hero is still O3’s Work frame (1634:1181) carrying a placeholder heading. This index has no document, so that copy lives in the view until O3XO’s own words for it exist.',
  },
})
