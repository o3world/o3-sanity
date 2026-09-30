import { SURFACE_CLASS, SurfaceProvider, surfaceAttrs, LayeredMediaReveal } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { stegaClean } from '@sanity/client/stega'

import { SanityImage } from '../../../SanityImage'
import { ARTICLE_COLUMN, CONTENT_COLUMN, FULL_BLEED } from '../../../imageSizes'
import { sectionBackground } from '../../sectionBackground'
import { resolveSurface } from '../../surface'

type MediaSectionProps = SectionProps<'mediaSection'> & { sequence?: boolean }

/** Case-study media plus About's inset photograph (3754:78276) and feature (4061:50283). */
export function MediaSection({
  media,
  variant,
  width,
  surface,
  backgroundMedia,
  heading,
  subheading,
  logo,
  badge,
  sequence = false,
}: MediaSectionProps) {
  if (!media) return null
  const fullBleed = stegaClean(width) === 'full-bleed'
  const resolved = resolveSurface(surface, 'mediaSection')
  const surfaceClass = SURFACE_CLASS[resolved]
  // `null` on every band that carries no picture — the same question
  // `SectionShell` asks its `background` prop. `relative isolate` goes on the
  // band only when there is something to position.
  const picture = sectionBackground(backgroundMedia, resolved)
  const bandClass = picture ? `${surfaceClass} relative isolate` : surfaceClass

  const composition = stegaClean(variant)
  if (composition === 'overlap' || composition === 'feature') {
    const feature = composition === 'feature'
    return (
      <SurfaceProvider surface={resolved}>
        <section
          {...surfaceAttrs(resolved)}
          className={`${bandClass} px-gutter relative flow-root`}
        >
          {picture}
          <figure className={`max-w-section relative mx-auto ${feature ? 'z-10 -mb-16' : ''}`}>
            <div
              className={
                feature
                  ? 'relative isolate overflow-hidden rounded-2xl px-4 pb-16 pt-32 shadow-[0_32px_64px_rgba(0,0,0,0.2)] [--feature-gradient-end:61.34%] lg:rounded-[32px] lg:px-12 lg:pb-[99px] lg:pt-[163px] lg:[--feature-gradient-end:100%]'
                  : 'relative isolate aspect-[1248/550] -translate-y-8 overflow-hidden rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.2)] lg:-translate-y-16 lg:rounded-[32px]'
              }
            >
              <SanityImage
                source={media.image}
                alt={media.alt}
                ratio="fill"
                width={2496}
                sizes={CONTENT_COLUMN}
                className="absolute inset-0 -z-10"
              />
              {feature ? (
                <>
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,rgba(10,10,11,0.2),rgba(0,0,0,0.8)_var(--feature-gradient-end))]"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 -z-10 bg-[linear-gradient(to_bottom,#eb1000,#ad0c00_var(--feature-gradient-end))] mix-blend-screen"
                  />
                  {badge ? (
                    <SanityImage
                      source={badge}
                      alt=""
                      width={314}
                      sizes="(min-width: 1024px) 314px, 147px"
                      className="absolute left-1/2 top-[18px] w-[147px] -translate-x-1/2 lg:top-12 lg:w-[314px]"
                    />
                  ) : null}
                  <div className="relative mx-auto flex max-w-[884px] flex-col items-center gap-8 text-center text-white">
                    {heading ? (
                      <h2
                        className={
                          logo
                            ? 'relative h-[55px] w-full max-w-[338px] lg:h-[154px] lg:max-w-[884px]'
                            : 'w-full'
                        }
                      >
                        {logo ? (
                          <>
                            <span className="sr-only">{heading}</span>
                            <SanityImage
                              source={logo}
                              alt=""
                              width={884}
                              sizes="(min-width: 1024px) 884px, calc(100vw - 64px)"
                              className="absolute left-[4.335%] top-[-2.915px] h-auto w-[90.092%] lg:left-[-0.035%] lg:top-[-8.36px] lg:w-[98.691%]"
                            />
                          </>
                        ) : (
                          <span className="font-display text-hero">{heading}</span>
                        )}
                      </h2>
                    ) : null}
                    {subheading ? (
                      <p className="max-w-[728px] whitespace-pre-line text-[20px] leading-[26px] lg:text-[24px] lg:leading-[34px]">
                        {subheading.replace(/\u2028/g, '\n')}
                      </p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
            {media.caption ? (
              <figcaption className="text-fg-subtle mt-4 text-sm">{media.caption}</figcaption>
            ) : null}
          </figure>
        </section>
      </SurfaceProvider>
    )
  }

  if (composition === 'composition') {
    return (
      <SurfaceProvider surface={resolved}>
        <section {...surfaceAttrs(resolved)} className={bandClass}>
          <LayeredMediaReveal
            enabled={sequence}
            className="relative overflow-hidden"
            foregroundClassName="max-w-section mx-auto w-full"
            caption={media.caption}
            captionClassName="text-fg-subtle px-gutter mt-4 text-sm"
          >
            {/* Edge to edge up to the 1728px structural column, then centred at it. */}
            <SanityImage
              source={media.image}
              alt={media.alt}
              width={2880}
              sizes="(min-width: 1728px) 1728px, 100vw"
              className="w-full"
            />
          </LayeredMediaReveal>
        </section>
      </SurfaceProvider>
    )
  }

  if (stegaClean(variant) === 'capture') {
    return (
      <SurfaceProvider surface={resolved}>
        <section {...surfaceAttrs(resolved)} className={bandClass}>
          {picture}
          <LayeredMediaReveal
            enabled={sequence}
            className={`px-gutter relative h-[520px] overflow-hidden pt-16 shadow-[inset_0_-16px_16px_0_rgba(0,0,0,0.05)] lg:h-[700px] ${picture ? '' : 'bg-(image:--gradient-screen-stage)'}`}
            foregroundClassName="max-w-article mx-auto w-full"
            caption={media.caption}
            captionClassName="text-fg-subtle px-gutter mt-4 text-sm"
          >
            <SanityImage
              source={media.image}
              alt={media.alt}
              width={1650}
              className="w-full rounded-[12px] shadow-[0_0_32px_0_rgba(0,0,0,0.4)]"
              sizes={ARTICLE_COLUMN}
            />
          </LayeredMediaReveal>
        </section>
      </SurfaceProvider>
    )
  }

  if (fullBleed) {
    return (
      <SurfaceProvider surface={resolved}>
        <section {...surfaceAttrs(resolved)} className={bandClass}>
          {picture}
          <figure>
            <div className="relative aspect-[402/257] overflow-hidden lg:aspect-[1440/576]">
              <SanityImage
                source={media.image}
                alt={media.alt}
                ratio="fill"
                width={2400}
                sizes={FULL_BLEED}
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
      <section {...surfaceAttrs(resolved)} className={`${bandClass} px-gutter pb-band-article`}>
        {picture}
        <figure
          className={`${stegaClean(width) === 'section' ? 'max-w-section' : 'max-w-article'} mx-auto w-full`}
        >
          <SanityImage
            source={media.image}
            alt={media.alt}
            width={1650}
            className="w-full shadow-[0_0_64px_0_rgba(0,0,0,0.1)]"
            sizes={stegaClean(width) === 'section' ? CONTENT_COLUMN : ARTICLE_COLUMN}
          />
          {media.caption ? (
            <figcaption className="text-fg-subtle mt-4 text-sm">{media.caption}</figcaption>
          ) : null}
        </figure>
      </section>
    </SurfaceProvider>
  )
}
