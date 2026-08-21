import { SURFACE_CLASS, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { SanityImage } from '@/content/SanityImage'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'
import { itemAttr } from '@/sanity/dataAttribute'

type ScreenGridSectionProps = SectionProps<'screenGridSection'>

/**
 * Section block: tiled product screenshots on gradient plates — the case-study
 * frame's screen bands (`2230:3315`, `2230:7559`), #97.
 *
 * ```
 * band     32px 96px                        (px-gutter, py-8)
 * grid     2 columns, gap 32                (single column below lg)
 * plate    radius 32, overflow hidden
 * screen   radius 12, shadow 0 0 32 / 0.25, top-aligned and cropped
 * ```
 *
 * **The plate crops the screenshot, and that is the whole effect.** Every tile
 * on both frames sets an oversized capture inside the plate and lets the
 * plate's rounded box cut it off — `2230:3315`'s lead tile holds an 807 × 2048
 * phone shot in a 716-tall plate. So the image renders at its own proportions,
 * hung 64px from the plate's top edge, and whatever runs past the floor is
 * clipped rather than scaled to fit.
 *
 * **Heights follow `span`, not a field.** `2230:7559` draws 716 for the wide
 * lead tile and 342 for the small ones — a ratio of about 1.74 and 1.78, near
 * enough one shape at two column counts, so both are expressed as aspect
 * ratios instead of the frame's fixed pixels (ADR 0006: frames are endpoints).
 * `2230:3315` draws its two standard tiles at 716 as well; that reads as that
 * band's composition rather than a second rule, and a per-tile height field
 * would be authoring layout rather than content.
 *
 * Below `lg` the grid collapses to one column and every plate takes the same
 * 4/3 box — a 1.78 plate on a 362px column is 203px tall, which is not a
 * screenshot, it is a strip.
 *
 * The band builds its own `<section>` rather than using `SectionShell`: 32px
 * is not one of the shell's band steps and should not become one. It is the
 * frame saying these bands butt against each other, not a rhythm choice.
 *
 * Static — no `use client`. Everything here is layout.
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
  standard: 'lg:aspect-[608/342]',
  wide: 'lg:col-span-2 lg:aspect-[1248/716]',
} as const

type Tone = keyof typeof TONE_CLASS
type Span = keyof typeof SPAN_CLASS

function toneOf(value: string | null | undefined): Tone {
  const clean = stegaClean(value)
  return clean === 'brand' || clean === 'bone' ? clean : 'ink'
}

function spanOf(value: string | null | undefined): Span {
  return stegaClean(value) === 'wide' ? 'wide' : 'standard'
}

export function ScreenGridSection({ screens, surface, loc }: ScreenGridSectionProps) {
  if (!screens?.length) return null

  const resolved = resolveSurface(surface, 'screenGridSection')

  return (
    <SurfaceProvider surface={resolved}>
      <section {...surfaceAttrs(resolved)} className={`${SURFACE_CLASS[resolved]} px-gutter py-8`}>
        <ul className="mx-auto grid w-full gap-8 lg:grid-cols-2">
          {screens.map((screen) => {
            const span = spanOf(screen.span)
            return (
              <li
                key={screen._key}
                // The tile's own path. This band has no header to attribute —
                // it is screens and nothing else.
                data-sanity={itemAttr(loc, 'screens', screen._key)}
                className={`aspect-4/3 relative overflow-hidden rounded-[32px] ${TONE_CLASS[toneOf(screen.tone)]} ${SPAN_CLASS[span]}`}
              >
                <div className="absolute inset-x-0 top-0 flex justify-center px-8 pt-8 lg:px-16 lg:pt-16">
                  <SanityImage
                    source={screen.media?.image}
                    alt={screen.media?.alt}
                    width={1600}
                    className="w-full rounded-[12px] shadow-[0_0_32px_0_rgba(0,0,0,0.25)]"
                    /*
                     * The plate is the tile less its padding — 32px a side
                     * below `lg`, 64px above — and this band takes the gutter
                     * without `max-w-section`, so above 1440 the tile keeps
                     * growing where every other band stops at 1248.
                     *
                     *   wide      the whole column: 90vw − 64, and
                     *             100vw − 2×96 − 128 once the gutter pins
                     *   standard  half of it, less half the 32px gap:
                     *             45vw − 80, and 50vw − 240 once pinned
                     *
                     * At 1440 that is the frame's 1120 and 480 exactly. 90vw
                     * as the column's stand-in is derived in `imageSizes.ts`.
                     */
                    sizes={
                      span === 'wide'
                        ? '(min-width: 1440px) calc(100vw - 320px), calc(90vw - 64px)'
                        : '(min-width: 1440px) calc(50vw - 240px), (min-width: 1024px) calc(45vw - 80px), calc(90vw - 64px)'
                    }
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </SurfaceProvider>
  )
}
