import type { DispatchedBlockWrapperProps, SectionProps } from '@o3/content-runtime/blocks'
import { MediaSection, ScreenGridSection, SectionReveal } from '@o3/content-ui'
import { stegaClean } from '@sanity/client/stega'

export function CaseStudyMediaSection(props: SectionProps<'mediaSection'>) {
  return <MediaSection {...props} sequence={props.loc?.type === 'caseStudy'} />
}

export function CaseStudyScreenGridSection(props: SectionProps<'screenGridSection'>) {
  return <ScreenGridSection {...props} sequence={props.loc?.type === 'caseStudy'} />
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
