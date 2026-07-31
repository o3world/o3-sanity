import { SectionShell } from '@o3/ui'
import { stegaClean } from 'next-sanity'

import { SanityImage } from '@/content/SanityImage'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type MediaSectionProps = SectionProps<'mediaSection'>

/** Section block: a full-width figure moment (contained or full-bleed). */
export function MediaSection({ media, width, surface }: MediaSectionProps) {
  if (!media) return null
  const fullBleed = stegaClean(width) === 'full-bleed'
  return (
    <SectionShell surface={resolveSurface(surface, 'white')}>
      <figure className={fullBleed ? 'py-12' : 'mx-auto max-w-5xl py-24'}>
        <SanityImage
          source={media.image}
          alt={media.alt}
          width={2400}
          className={fullBleed ? 'w-full' : 'rounded-card w-full'}
          sizes="100vw"
        />
        {media.caption ? (
          <figcaption className="text-fg-subtle mt-4 text-sm">{media.caption}</figcaption>
        ) : null}
      </figure>
    </SectionShell>
  )
}
