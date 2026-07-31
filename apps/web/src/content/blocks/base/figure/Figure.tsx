import { SanityImage } from '@/content/SanityImage'
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
        sizes="(min-width: 1024px) 50vw, 100vw"
      />
      {caption ? <figcaption className="text-fg-subtle mt-3 text-sm">{caption}</figcaption> : null}
    </figure>
  )
}
