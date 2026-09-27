import type { DispatchedBlockWrapperProps } from '@o3/content-runtime/blocks'
import { SectionReveal } from '@o3/content-ui'
import { cn } from '@o3/ui/lib/utils'
import { stegaClean } from '@sanity/client/stega'

export function InteriorSectionReveal(props: DispatchedBlockWrapperProps) {
  const { blockType, block, children, ...rest } = props
  const { heading, eyebrow, subheading, layout, variant } = block as {
    heading?: string
    eyebrow?: string
    subheading?: string
    layout?: string
    variant?: string
  }
  if (blockType === 'mediaSection' && stegaClean(variant) === 'feature')
    return (
      <SectionReveal
        {...props}
        className={cn(
          rest.className,
          'relative z-10 [&+div>section]:pt-32 lg:[&+div>section]:pt-48',
        )}
      />
    )
  if (
    (blockType === 'layoutSection' && (heading || eyebrow || subheading)) ||
    (blockType === 'railPanelsSection' && stegaClean(layout) === 'track')
  )
    return <div {...rest}>{children}</div>
  return <SectionReveal {...props} />
}
