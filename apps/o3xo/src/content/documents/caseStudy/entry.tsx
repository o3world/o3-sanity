import { CASE_STUDY_QUERY } from '@o3/sanity/queries'
import { collectionPrefixes } from '@o3/sanity/brand'
import type { CASE_STUDY_QUERY_RESULT } from '@o3/sanity/types/generated'

import { defineDetailType, type RendererProps } from '@o3/content-runtime/routes'
import type { DocumentSeo } from '@o3/content-runtime/seo'

import { getView } from '@/content/documents/registry'

type CaseStudyRendererProps = RendererProps<typeof CASE_STUDY_QUERY>

function CaseStudyRenderer({ slug: _slug, ...rest }: CaseStudyRendererProps) {
  const doc = rest as NonNullable<CASE_STUDY_QUERY_RESULT>
  const View = getView('caseStudy')
  return <View {...doc} />
}

export const caseStudy = defineDetailType({
  type: 'caseStudy',
  urlPrefix: collectionPrefixes().caseStudy,
  query: CASE_STUDY_QUERY,
  renderer: CaseStudyRenderer,
  seo: (doc): DocumentSeo => {
    const cs = doc as NonNullable<CASE_STUDY_QUERY_RESULT>
    return {
      title: cs.title,
      description: cs.narrativeHeadline,
      image: cs.heroMedia,
      path: `${collectionPrefixes().caseStudy}/${cs.slug}`,
    }
  },
})
