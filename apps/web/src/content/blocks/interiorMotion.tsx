import type { DispatchedBlockWrapperProps } from '@o3/content-runtime/blocks'
import { SectionReveal } from '@o3/content-ui'
import { stegaClean } from '@sanity/client/stega'

export function InteriorSectionReveal(props: DispatchedBlockWrapperProps) {
  const { blockType, block, children, ...rest } = props
  const { heading, eyebrow, subheading, layout } = block as {
    heading?: string
    eyebrow?: string
    subheading?: string
    layout?: string
  }
  if (
    (blockType === 'layoutSection' && (heading || eyebrow || subheading)) ||
    (blockType === 'railPanelsSection' && stegaClean(layout) === 'track')
  )
    return <div {...rest}>{children}</div>
  return <SectionReveal {...props} />
}
