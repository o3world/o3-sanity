import type { DispatchedBlockWrapperProps, SectionProps } from '@o3/content-runtime/blocks'
import { MediaSection, ScreenGridSection, SectionReveal } from '@o3/content-ui'
import { stegaClean } from '@sanity/client/stega'

/** The accepted IRONMAN tracer is the only document opting into these scenes. */
export function hasCaseStudyMotion(documentId?: string) {
  return documentId?.replace(/^drafts\./, '') === 'caseStudy-wp-10028'
}

export function CaseStudyMediaSection(props: SectionProps<'mediaSection'>) {
  return <MediaSection {...props} sequence={hasCaseStudyMotion(props.loc?.id)} />
}

export function CaseStudyScreenGridSection(props: SectionProps<'screenGridSection'>) {
  return <ScreenGridSection {...props} sequence={hasCaseStudyMotion(props.loc?.id)} />
}

/** A capture owns its inner motion, so its enclosing band stays painted and still. */
export function CaseStudySectionReveal(props: DispatchedBlockWrapperProps) {
  const { blockType, block, children, ...rest } = props
  if (
    blockType === 'screenGridSection' ||
    (blockType === 'mediaSection' &&
      stegaClean((block as { variant?: string }).variant) === 'capture')
  )
    return <div {...rest}>{children}</div>
  return <SectionReveal {...props} />
}
