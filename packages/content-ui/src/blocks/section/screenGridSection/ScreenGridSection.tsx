import { SURFACE_CLASS, SurfaceProvider, surfaceAttrs, RevealSequence } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { itemAttr } from '@o3/content-runtime/data-attribute'
import { stegaClean } from '@sanity/client/stega'

import { SanityImage } from '../../../SanityImage'
import { CONTENT_COLUMN } from '../../../imageSizes'
import { resolveSurface } from '../../surface'

type ScreenGridSectionProps = SectionProps<'screenGridSection'> & { sequence?: boolean }

/** Current case-study grids keep each standard asset's complete composition.
 * Tall and short exports carry their own ratio; wide captures retain a cropped plate.
 */
/** Plate fills. Written out in full because the class scanner cannot see an interpolated one. */
const TONE_CLASS = {
  /* `2230:3315`'s lead plate. */
  ink: 'bg-(image:--gradient-screen-plate)',
  /* The frames' brand plates are IRONMAN's own gradients (ADR 0007 — demo
   * content), so the block offers O3's red instead: `Gradient/Red/1`. */
  brand: 'bg-brand-glow',
  /* `2230:7559`'s #F1F0EC plates — the bone token exactly. */
  bone: 'bg-bone',
} as const

const SPAN_CLASS = {
  standard: 'self-start',
  narrow: 'self-start',
  wide: 'aspect-4/3 lg:aspect-[1248/700]',
} as const

type Tone = keyof typeof TONE_CLASS
type Span = keyof typeof SPAN_CLASS

function toneOf(value: string | null | undefined): Tone {
  const clean = stegaClean(value)
  return clean === 'brand' || clean === 'bone' ? clean : 'ink'
}

function spanOf(value: string | null | undefined): Span {
  const clean = stegaClean(value)
  return clean === 'wide' || clean === 'narrow' ? clean : 'standard'
}

export function ScreenGridSection({
  screens,
  layout,
  surface,
  loc,
  sequence = false,
}: ScreenGridSectionProps) {
  if (!screens?.length) return null

  const resolved = resolveSurface(surface, 'screenGridSection')
  const feature = stegaClean(layout) === 'feature' && screens.length >= 3

  const grid = (
    <ul
      className={`max-w-section mx-auto grid w-full gap-8 ${feature ? 'grid-cols-2 lg:grid-cols-4' : 'lg:grid-cols-2'}`}
    >
      {screens.map((screen, index) => {
        const span = spanOf(screen.span)
        const fill = span !== 'wide' || stegaClean(screen.framing) === 'image'
        const placement = feature
          ? index === 0
            ? 'col-span-2 lg:col-span-3 lg:row-span-2'
            : index < 3
              ? 'lg:col-span-1'
              : span === 'wide'
                ? 'col-span-2 lg:col-span-4'
                : span === 'narrow'
                  ? 'lg:col-span-1'
                  : 'col-span-2'
          : span === 'wide'
            ? 'lg:col-span-2'
            : ''
        return (
          <li
            key={screen._key}
            data-reveal-boundary={sequence ? '' : undefined}
            // The tile's own path. This band has no header to attribute —
            // it is screens and nothing else.
            data-sanity={itemAttr(loc, 'screens', screen._key)}
            className={`relative overflow-hidden rounded-[32px] ${fill ? '' : TONE_CLASS[toneOf(screen.tone)]} ${placement} ${fill ? 'self-start' : feature && index === 0 ? 'aspect-4/3 lg:aspect-[928/700]' : SPAN_CLASS[span]}`}
          >
            <div
              data-reveal-step={sequence ? 'screen' : undefined}
              className={
                fill
                  ? 'relative'
                  : 'absolute inset-x-0 top-0 flex justify-center px-8 pt-8 lg:px-16 lg:pt-16'
              }
            >
              <SanityImage
                source={screen.media?.image}
                alt={screen.media?.alt}
                width={1600}
                className={
                  fill
                    ? 'h-auto w-full'
                    : 'w-full rounded-[12px] shadow-[0_0_32px_0_rgba(0,0,0,0.25)]'
                }
                // The 1728px stage and 32px gaps cap the full, half, quarter,
                // and three-quarter slots at 1728, 848, 408, and 1288px.
                // Framed wide images also lose 64px/128px to plate padding.
                sizes={
                  feature && (index < 3 || span === 'narrow')
                    ? index === 0
                      ? `(min-width: 1920px) 1288px, (min-width: 1440px) calc(75vw - 152px), (min-width: 1024px) calc(63.439305vw + 14.47399px), ${CONTENT_COLUMN}`
                      : '(min-width: 1920px) 408px, (min-width: 1440px) calc(25vw - 72px), (min-width: 1024px) calc(21.146435vw - 16.50867px), (min-width: 402px) calc(42.29287vw - 1.01734px), calc(50vw - 32px)'
                    : span === 'wide' && fill
                      ? CONTENT_COLUMN
                      : span === 'wide'
                        ? '(min-width: 1920px) 1600px, (min-width: 1440px) calc(100vw - 320px), (min-width: 1024px) calc(84.58574vw - 98.03468px), (min-width: 402px) calc(84.58574vw - 34.03468px), calc(100vw - 96px)'
                        : `(min-width: 1920px) 848px, (min-width: 1440px) calc(50vw - 112px), (min-width: 1024px) calc(42.29287vw - 1.01734px), ${CONTENT_COLUMN}`
                }
              />
            </div>
          </li>
        )
      })}
    </ul>
  )

  return (
    <SurfaceProvider surface={resolved}>
      <section {...surfaceAttrs(resolved)} className={`${SURFACE_CLASS[resolved]} px-gutter py-8`}>
        {sequence ? <RevealSequence boundaries="items">{grid}</RevealSequence> : grid}
      </section>
    </SurfaceProvider>
  )
}
