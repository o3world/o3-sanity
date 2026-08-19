import { SURFACE_CLASS, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { stegaClean } from '@sanity/client/stega'

import { SanityImage } from '../../../SanityImage'
import { resolveSurface } from '../../surface'

type MediaSectionProps = SectionProps<'mediaSection'>

/**
 * Section block: a full-width figure moment, built to the Case Study frame's
 * two media treatments (#44) — the only canonical frame that draws this block.
 *
 * | `variant` / `width`     | Frame                    | Shape                                  |
 * | ----------------------- | ------------------------ | -------------------------------------- |
 * | `plain` / `full-bleed`  | `1647:1721` / `1906:900` | edge to edge, 1440 × 576 (402 × 257)   |
 * | `plain` / `contained`   | `1899:4186`              | the 822px article measure, soft shadow |
 * | `capture`               | `1647:1720`              | a 700px dark stage the capture is cropped by |
 *
 * **`capture` is a band that crops, not a figure that fits** (#97). The frame
 * hangs an 822 × 1555 page screenshot on a full-bleed dark stage, 64px from
 * the top, and lets the band's 700px floor cut it off — the "here is the whole
 * page, and it keeps going" move. So the image renders at its own proportions
 * on the article measure and the band clips it, exactly as `ScreenGridSection`
 * treats a plate. `width` is hidden in Studio when this variant is on, because
 * a capture is full-bleed by construction.
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
export function MediaSection({ media, variant, width, surface }: MediaSectionProps) {
  if (!media) return null
  const fullBleed = stegaClean(width) === 'full-bleed'
  const resolved = resolveSurface(surface, 'mediaSection')
  const surfaceClass = SURFACE_CLASS[resolved]

  if (stegaClean(variant) === 'capture') {
    return (
      <SurfaceProvider surface={resolved}>
        <section {...surfaceAttrs(resolved)} className={surfaceClass}>
          <figure>
            {/*
             * The stage: `--gradient-screen-stage` at 135° with the frame's
             * `inset 0 -16px 16px rgba(0,0,0,0.05)` foot, 64px of top padding,
             * and a fixed height it clips at. 700 is the 1440 value; below `lg`
             * the band shortens rather than scaling the capture, so the same
             * amount of page is legible at both widths (ADR 0006).
             */}
            <div className="px-gutter bg-(image:--gradient-screen-stage) relative h-[520px] overflow-hidden pt-16 shadow-[inset_0_-16px_16px_0_rgba(0,0,0,0.05)] lg:h-[700px]">
              <div className="max-w-article mx-auto w-full">
                <SanityImage
                  source={media.image}
                  alt={media.alt}
                  width={1650}
                  className="w-full rounded-[12px] shadow-[0_0_32px_0_rgba(0,0,0,0.4)]"
                  sizes="(min-width: 1024px) 822px, 100vw"
                />
              </div>
            </div>
            {media.caption ? (
              <figcaption className="text-fg-subtle px-gutter mt-4 text-sm">
                {media.caption}
              </figcaption>
            ) : null}
          </figure>
        </section>
      </SurfaceProvider>
    )
  }

  if (fullBleed) {
    return (
      <SurfaceProvider surface={resolved}>
        <section {...surfaceAttrs(resolved)} className={surfaceClass}>
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
      </SurfaceProvider>
    )
  }

  return (
    <SurfaceProvider surface={resolved}>
      <section {...surfaceAttrs(resolved)} className={`${surfaceClass} px-gutter pb-band-article`}>
        <figure className="max-w-article mx-auto w-full">
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
    </SurfaceProvider>
  )
}
