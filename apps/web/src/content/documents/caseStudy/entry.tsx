import { CASE_STUDY_QUERY } from '@o3/sanity/queries'
import { collectionPrefixes } from '@o3/sanity/brand'
import type { CASE_STUDY_QUERY_RESULT } from '@o3/sanity/types/generated'

import { getBaseUrl } from '@o3/content-runtime/base-url'
import { defineDetailType, type RendererProps } from '@o3/content-runtime/routes'
import type { DocumentSeo } from '@o3/content-runtime/seo'

import { getView } from '@/content/documents/registry'
import { JsonLd } from '@/content/structuredData/JsonLd'
import { breadcrumbs } from '@/content/structuredData/schema'

import { caseStudyIndex } from './collectionIndex'

type CaseStudyRendererProps = RendererProps<typeof CASE_STUDY_QUERY>

function CaseStudyRenderer({ slug, ...rest }: CaseStudyRendererProps) {
  const doc = rest as NonNullable<CASE_STUDY_QUERY_RESULT>
  const View = getView('caseStudy')
  const prefix = collectionPrefixes().caseStudy
  return (
    <>
      <JsonLd
        data={breadcrumbs(getBaseUrl(), [
          { name: caseStudyIndex.seo?.title ?? 'Work', path: prefix },
          // A case study's title is its headline ("Built for the long run."); the client names it.
          { name: doc.client?.name ?? doc.title ?? '', path: `${prefix}/${slug}` },
        ])}
      />
      <View {...doc} />
    </>
  )
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
      // The share preview follows the card chain: a card picture is chosen to
      // represent the document in a small frame, which is the crop a social
      // card takes. `cardMedia` arrives already falling back to the hero.
      image: cs.cardMedia,
      path: `${collectionPrefixes().caseStudy}/${cs.slug}`,
    }
  },
})
