import type { BaseProps } from '@o3/content-runtime/blocks'

import { SanityImage } from '../../../SanityImage'

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
