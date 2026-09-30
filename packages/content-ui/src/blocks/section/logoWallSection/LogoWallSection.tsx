import type { CSSProperties } from 'react'
import { Eyebrow, SURFACE_CLASS, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { stegaClean } from '@sanity/client/stega'

import { ButtonLink } from '../../../ButtonLink'
import { SanityImage } from '../../../SanityImage'
import { isDarkSurface, resolveSurface } from '../../surface'
import { MarqueeTrack } from './MarqueeTrack'
import './logo-wall.css'

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
 * 43px logo strip. Partner (3895:17711) shares the composition with a tiled ground.
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
  const resolved = resolveSurface(surface, 'logoWallSection')
  const onInk = isDarkSurface(resolved)
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
          'flex flex-col items-center gap-16 px-4 pb-16 pt-32 lg:px-16',
          onInk && 'bg-charcoal',
          onInk && isBar && 'logo-wall-texture',
        )}
      >
        <div
          className={cn(
            'flex w-full flex-col items-center border-b',
            onInk ? 'border-on-utility-line' : 'border-line',
          )}
        >
          <div className="flex w-full max-w-[900px] flex-col items-center gap-6 pb-20 text-center">
            {eyebrow ? (
              <Eyebrow size="lg" className={cn('pb-4', onInk && 'text-on-utility')}>
                {eyebrow}
              </Eyebrow>
            ) : null}
            {heading ? (
              <h2
                className={cn(
                  'font-display text-display-xl text-balance',
                  onInk ? 'text-white' : 'text-ink',
                )}
              >
                {heading}
              </h2>
            ) : null}
            {body ? (
              <p
                className={cn('text-lead text-pretty', onInk ? 'text-on-utility' : 'text-fg-body')}
              >
                {body}
              </p>
            ) : null}
          </div>
        </div>

        <div className="-mx-4 flex justify-center self-stretch overflow-hidden lg:-mx-16">
          <MarqueeTrack
            copies={copies}
            className={onInk ? 'mix-blend-screen' : 'mix-blend-multiply'}
          >
            {track.map(({ client, copy }) => (
              <li
                key={`${copy}-${client._id}`}
                // Every copy after the first is the same six marks again. A
                // reader hears the partners once.
                aria-hidden={copy > 0 || undefined}
                className="group/logo flex h-[43px] w-[239px] shrink-0 items-center justify-center pr-16"
              >
                <SanityImage
                  source={client.logo}
                  alt={client.name ?? ''}
                  width={456}
                  loading="eager"
                  className={cn(
                    'ease-soft max-h-[43px] w-full object-contain grayscale transition-[opacity,filter] duration-500 motion-reduce:transition-none',
                    onInk
                      ? cn(
                          'opacity-40 invert group-hover/logo:opacity-60',
                          client.logo?.asset?.metadata?.hasAlpha !== false && 'brightness-0',
                        )
                      : 'opacity-90 group-hover/logo:opacity-100 group-hover/logo:contrast-125',
                  )}
                  sizes="175px"
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
