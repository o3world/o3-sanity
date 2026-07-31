import type { Metadata } from 'next'

import { CASE_STUDY_QUERY } from '@o3/sanity/queries'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import type { CASE_STUDY_QUERY_RESULT } from '@o3/sanity/types/generated'

import { defineDetailType } from '@/lib/content-routes/define'
import type { RendererProps } from '@/lib/content-routes/types'
import { getView } from '@/content/documents/registry'

type CaseStudyRendererProps = RendererProps<typeof CASE_STUDY_QUERY>

function CaseStudyRenderer({ slug: _slug, ...rest }: CaseStudyRendererProps) {
  const doc = rest as NonNullable<CASE_STUDY_QUERY_RESULT>
  const View = getView('caseStudy')
  return <View {...doc} />
}

export const caseStudy = defineDetailType({
  type: 'caseStudy',
  urlPrefix: COLLECTION_PREFIXES.caseStudy,
  query: CASE_STUDY_QUERY,
  renderer: CaseStudyRenderer,
  metadata: (doc): Metadata => {
    const cs = doc as NonNullable<CASE_STUDY_QUERY_RESULT>
    return {
      title: cs.seo?.title ?? cs.title,
      description: cs.seo?.description ?? cs.narrativeHeadline ?? undefined,
    }
  },
})
