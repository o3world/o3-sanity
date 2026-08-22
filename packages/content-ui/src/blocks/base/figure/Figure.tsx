import type { BaseProps } from '@o3/content-runtime/blocks'

import { SanityImage } from '../../../SanityImage'
import { CONTENT_COLUMN } from '../../../imageSizes'

type FigureProps = BaseProps<'figure'> & {
  /**
   * The `sizes` of the column this figure was placed in, from the section that
   * placed it (`layoutSection` passes `LAYOUT_COLUMN[count]`). Absent when a
   * figure is rendered outside a column, where the content column is the slot.
   */
  slotSizes?: string
}

/** Base block: an image with required alt text and optional caption. */
export function Figure({ image, alt, caption, slotSizes }: FigureProps) {
  return (
    <figure>
      <SanityImage
        source={image}
        alt={alt}
        width={1600}
        className="rounded-card w-full"
        sizes={slotSizes ?? CONTENT_COLUMN}
      />
      {caption ? <figcaption className="text-fg-subtle mt-3 text-sm">{caption}</figcaption> : null}
    </figure>
  )
}
