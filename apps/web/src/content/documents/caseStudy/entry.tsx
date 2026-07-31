import type { Metadata } from 'next'
import { draftMode } from 'next/headers'

import { CASE_STUDY_QUERY } from '@o3/sanity/queries'
import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import type { CASE_STUDY_QUERY_RESULT } from '@o3/sanity/types/generated'

import { defineDetailType } from '@/lib/content-routes/define'
import type { RendererProps } from '@/lib/content-routes/types'
import { getView } from '@/content/documents/registry'

type CaseStudyRendererProps = RendererProps<typeof CASE_STUDY_QUERY>

async function CaseStudyRenderer({ slug: _slug, ...rest }: CaseStudyRendererProps) {
  const doc = rest as NonNullable<CASE_STUDY_QUERY_RESULT>
  // `draftMode()` is hoisted here so the View stays a sync component; the
  // flag routes `extraSections` through ClientBlockRenderer (Presentation
  // optimistic reorder) in draft preview.
  const { isEnabled: isDraft } = await draftMode()
  const View = getView('caseStudy')
  return <View {...doc} isDraft={isDraft} />
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
