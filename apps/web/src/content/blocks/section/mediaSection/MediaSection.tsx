import { SURFACE_CLASS } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { SanityImage } from '@/content/SanityImage'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type MediaSectionProps = SectionProps<'mediaSection'>

/**
 * Section block: a full-width figure moment, built to the Case Study frame's
 * two media treatments (#44) — the only canonical frame that draws this block.
 *
 * | `width`      | Frame                    | Shape                                  |
 * | ------------ | ------------------------ | -------------------------------------- |
 * | `full-bleed` | `1647:1721` / `1906:900` | edge to edge, 1440 × 576 (402 × 257)   |
 * | `contained`  | `1899:4186`              | the 822px article measure, soft shadow |
 *
 * `contained` sits on the **article measure**, not `--container-content` —
 * the frame lines a contained figure up with the chapter prose around it (824
 * drawn against the chapters' 822) rather than with the wider statement
 * column. Its `0 0 64px rgba(0,0,0,0.1)` lift is what makes a screenshot read
 * as a page rather than as a picture; it occurs once, so it stays a literal.
 *
 * **Neither variant pads its own top.** The frame lets the chapter band above
 * supply the air and runs the media straight into the band below, so a media
 * block that opened with its own 164px would double it.
 *
 * The band builds its own `<section>` rather than using `SectionShell`,
 * because `full-bleed` has to escape the gutter the shell always applies.
 */
export function MediaSection({ media, width, surface }: MediaSectionProps) {
  if (!media) return null
  const fullBleed = stegaClean(width) === 'full-bleed'
  const surfaceClass = SURFACE_CLASS[resolveSurface(surface, 'white')]

  if (fullBleed) {
    return (
      <section className={surfaceClass}>
        <figure>
          <div className="relative aspect-[402/257] overflow-hidden lg:aspect-[1440/576]">
            <SanityImage
              source={media.image}
              alt={media.alt}
              ratio="fill"
              width={2400}
              sizes="100vw"
            />
          </div>
          {media.caption ? (
            <figcaption className="text-fg-subtle px-gutter mt-4 text-sm">
              {media.caption}
            </figcaption>
          ) : null}
        </figure>
      </section>
    )
  }

  return (
    <section className={`${surfaceClass} px-gutter pb-[clamp(96px,calc(6.55vw+69.7px),164px)]`}>
      <figure className="mx-auto w-full max-w-[822px]">
        <SanityImage
          source={media.image}
          alt={media.alt}
          width={1650}
          className="w-full shadow-[0_0_64px_0_rgba(0,0,0,0.1)]"
          sizes="(min-width: 1024px) 822px, 100vw"
        />
        {media.caption ? (
          <figcaption className="text-fg-subtle mt-4 text-sm">{media.caption}</figcaption>
        ) : null}
      </figure>
    </section>
  )
}
