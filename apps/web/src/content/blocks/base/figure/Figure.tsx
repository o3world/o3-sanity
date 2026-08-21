import { SanityImage } from '@/content/SanityImage'
import { CONTENT_COLUMN } from '@/content/imageSizes'
import type { BaseProps } from '@/content/blocks/sectionTypes'

type FigureProps = BaseProps<'figure'>

/** Base block: an image with required alt text and optional caption. */
export function Figure({ image, alt, caption }: FigureProps) {
  return (
    <figure>
      <SanityImage
        source={image}
        alt={alt}
        width={1600}
        className="rounded-card w-full"
        // A base block cannot know its slot: `layoutSection` puts it in one of
        // 1–3 columns and the count is the section's field, not the figure's.
        // So it declares the widest column it can be handed — one column, the
        // whole content column — because over-declaring costs bytes on a 1x
        // display and under-declaring upscales the picture on every display.
        sizes={CONTENT_COLUMN}
      />
      {caption ? <figcaption className="text-fg-subtle mt-3 text-sm">{caption}</figcaption> : null}
    </figure>
  )
}
