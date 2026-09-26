import type { CSSProperties } from 'react'
import { Eyebrow, SURFACE_CLASS, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { stegaClean } from '@sanity/client/stega'

import { ButtonLink } from '../../../ButtonLink'
import { SanityImage } from '../../../SanityImage'
import { resolveSurface } from '../../surface'
import { MarqueeTrack } from './MarqueeTrack'

type LogoWallSectionProps = SectionProps<'logoWallSection'>

// Include each logo's trailing gap in its item, so every marquee copy has
// exactly the same width, including the seam from the last mark to the first.
const LOGO_STRIDE = 175 + 64
const TRACK_MIN_WIDTH = 4800

function marqueeCopies(count: number) {
  if (count < 1) return 1
  return Math.max(2, Math.ceil(TRACK_MIN_WIDTH / (count * LOGO_STRIDE)))
}

/**
 * Home partners (3720:60483 / 3726:62792): a ruled intro above an unboxed
 * 43px logo strip. The partner-page bar retains its compact composition.
 * MarqueeTrack owns the existing crawl, pointer settling and reduced motion.
 */
export function LogoWallSection({
  eyebrow,
  heading,
  body,
  layout,
  clients,
  button,
  surface,
}: LogoWallSectionProps) {
  const isBar = stegaClean(layout) === 'bar'
  // The Home composition paints an opaque light wash, including for older saved bands.
  const resolved = isBar ? resolveSurface(surface, 'logoWallSection') : 'bone'
  const marks = clients ?? []
  const copies = marqueeCopies(marks.length)
  const track = Array.from({ length: copies }, (_, copy) =>
    marks.map((client) => ({ client, copy })),
  ).flat()

  return (
    <SurfaceProvider surface={resolved}>
      <section
        {...surfaceAttrs(resolved)}
        style={
          isBar
            ? undefined
            : ({ '--duration-marquee': '64s', '--marquee-settle': '480ms' } as CSSProperties)
        }
        className={cn(
          SURFACE_CLASS[resolved],
          'flex flex-col items-center',
          resolved !== 'ink' && 'bg-(image:--gradient-surface-wash-warm)',
          isBar ? 'px-gutter pb-band-sm pt-band-sm gap-6' : 'gap-16 px-4 pb-16 pt-32 lg:px-16',
        )}
      >
        <div className={cn('flex w-full flex-col items-center', !isBar && 'border-line border-b')}>
          <div
            className={cn(
              'flex w-full flex-col items-center text-center',
              isBar ? 'gap-8' : 'max-w-[900px] gap-6 pb-20',
            )}
          >
            {eyebrow ? (
              <Eyebrow size="lg" className={isBar ? undefined : 'pb-4'}>
                {eyebrow}
              </Eyebrow>
            ) : null}
            {heading ? (
              <h2
                className={cn(
                  'font-display text-balance',
                  resolved === 'ink' ? 'text-fg' : 'text-ink',
                  isBar ? 'text-display-lg max-w-[1026px]' : 'text-display-xl',
                )}
              >
                {heading}
              </h2>
            ) : null}
            {body ? (
              <p className={cn('text-lead text-fg-body text-pretty', isBar && 'max-w-[724px]')}>
                {body}
              </p>
            ) : null}
          </div>
        </div>

        <div
          className={cn(
            'flex justify-center self-stretch overflow-hidden',
            isBar ? '-mx-gutter' : '-mx-4 lg:-mx-16',
          )}
        >
          <MarqueeTrack copies={copies} className={cn(resolved !== 'ink' && 'mix-blend-multiply')}>
            {track.map(({ client, copy }) => (
              <li
                key={`${copy}-${client._id}`}
                // Every copy after the first is the same six marks again. A
                // reader hears the partners once.
                aria-hidden={copy > 0 || undefined}
                className={cn(
                  'flex shrink-0 items-center justify-center',
                  !isBar && 'group/logo',
                  isBar
                    ? 'h-[100px] w-[168px] px-8 sm:w-[224px] sm:px-12 lg:w-[280px] lg:px-16'
                    : 'h-[43px] w-[239px] pr-16',
                )}
              >
                <SanityImage
                  source={client.logo}
                  alt={client.name ?? ''}
                  width={456}
                  loading="eager"
                  className={cn(
                    'w-full object-contain grayscale',
                    isBar ? 'max-h-[80px]' : 'max-h-[43px]',
                    !isBar &&
                      'ease-soft opacity-90 transition-[opacity,filter] duration-500 group-hover/logo:opacity-100 group-hover/logo:contrast-125 motion-reduce:transition-none',
                  )}
                  sizes={
                    isBar ? '(min-width: 1024px) 152px, (min-width: 640px) 128px, 104px' : '175px'
                  }
                />
              </li>
            ))}
          </MarqueeTrack>
        </div>

        {button ? <ButtonLink button={button} size="large" className="relative z-10" /> : null}
      </section>
    </SurfaceProvider>
  )
}
