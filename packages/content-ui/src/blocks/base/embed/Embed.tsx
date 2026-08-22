import type { BaseProps } from '@o3/content-runtime/blocks'

import { toEmbedSrc } from '../../../portable-text/embedSrc'

type EmbedProps = BaseProps<'embed'>

/** Base block: a video/oEmbed URL rendered as a responsive iframe. */
export function Embed({ url, caption }: EmbedProps) {
  if (!url) return null
  return (
    <figure>
      <div className="rounded-card bg-ink aspect-video overflow-hidden">
        <iframe
          src={toEmbedSrc(url)}
          title={caption ?? 'Embedded media'}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      {caption ? <figcaption className="text-fg-subtle mt-3 text-sm">{caption}</figcaption> : null}
    </figure>
  )
}
