import { SURFACE_CLASS, SurfaceProvider, surfaceAttrs, RevealSequence } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { itemAttr } from '@o3/content-runtime/data-attribute'
import { stegaClean } from '@sanity/client/stega'

import { SanityImage } from '../../../SanityImage'
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
      className={`mx-auto grid w-full gap-8 ${feature ? 'grid-cols-2 lg:grid-cols-4' : 'lg:grid-cols-2'}`}
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
                /*
                 * The plate is the tile less its padding — 32px a side
                 * below `lg`, 64px above — and this band takes the gutter
                 * without `max-w-section`, so the tile keeps growing past
                 * the structural stage cap.
                 *
                 *   wide      the whole column less 64 before `lg`, then
                 *             less 128; 100vw − 2×75 − 128 once pinned
                 *   standard  the full half-column tile, less half the 32px gap:
                 *             45vw − 16, and 50vw − 91 once pinned
                 *
                 * At 1440 that is 1162 and 629 after the #429 gutter
                 * override. The 90vw stand-in is derived in
                 * `imageSizes.ts`.
                 */
                sizes={
                  feature && index < 3
                    ? index === 0
                      ? '(min-width: 1024px) calc((100vw - 192px) * .75 - 8px), calc(100vw - 32px)'
                      : '(min-width: 1024px) calc((100vw - 192px) * .25 - 24px), calc(50vw - 32px)'
                    : span === 'narrow'
                      ? `(min-width: 1024px) calc((100vw - 192px) * .25 - 24px), ${feature ? 'calc(50vw - 32px)' : 'calc(100vw - 32px)'}`
                      : span === 'wide' && fill
                        ? '(min-width: 1024px) calc(100vw - 192px), calc(100vw - 32px)'
                        : span === 'wide'
                          ? '(min-width: 1440px) calc(100vw - 278px), (min-width: 1024px) calc(89.402vw - 125.396px), calc(90vw - 64px)'
                          : '(min-width: 1440px) calc(50vw - 91px), (min-width: 1024px) calc(44.701vw - 14.698px), 90vw'
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
