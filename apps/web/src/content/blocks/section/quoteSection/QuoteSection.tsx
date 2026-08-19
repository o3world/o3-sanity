import { OrbitalSphere, SURFACE_CLASS, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { DECORATED_BAND_CLASS, resolveDecoration } from '@/content/blocks/decoration'
import { MoleculeDecoration } from '@/content/blocks/MoleculeDecoration'
import { resolveSurface } from '@/content/blocks/surface'

type QuoteSectionProps = SectionProps<'quoteSection'>

/**
 * Section block: the pull quote, built to the Home frame's second "Intro
 * section" (`1683:2137`) — #42.
 *
 * `192px 96px`, and inside it a **1034px** column (`--container-content`,
 * node `1756:2085`) with 24px between the two parts:
 *
 * - **Quote** — 64px filled with `--gradient-statement`, so it starts at ink
 *   and finishes at 40%. On an eight-line quote that fade is the whole effect.
 *   Its step is `--text-quote`, not `--text-hero`: at 402 the frame sets this
 *   node 30px (`1814:1684`) against the hero headline's and the partners
 *   statement's 36, and the three only converge again at 64 (ADR 0006
 *   amendment 2026-08-02). This node is where the old shared floor was
 *   measured from, so it is the one call site the change does not move.
 * - **Attribution** — 36px at `rgba(10,10,10,0.5)` (`--color-fg-quiet`) on a
 *   1.5em line, in an 822px measure. **Not an eyebrow**: the scaffold set it
 *   as a red uppercase kicker, which is neither the size, the case, nor the
 *   colour the frame uses.
 *
 * Both are flush **left** in a centred column — not centred text.
 *
 * The quotation marks belong to the frame's string, so they are added here
 * rather than stored: an editor should not have to remember to type the
 * glyphs, and a typed `"` would render as a straight quote.
 *
 * **`decoration: 'molecule'`** is the 2026-08 case-study band (`2250:1525`,
 * #97): the same column and the same gradient fill, with the molecule mark
 * instead of the two spheres — 699px at 10%, hung off the band's right edge at
 * the frame's own offsets (x 944 against a 1440 frame, y 181) and clipped by
 * the band's `overflow-hidden`. Hidden below `lg` for the same reason the
 * spheres are: a 699px decoration on a 402px frame is not a decoration.
 */
export function QuoteSection({ quote, attribution, decoration, surface }: QuoteSectionProps) {
  if (!quote) return null
  const resolved = resolveSurface(surface, 'quoteSection')
  // The spheres and the molecule are alternatives: the band draws one or neither.
  const showOrbs = resolveDecoration(decoration, 'quoteSection') === 'orbs'

  return (
    <SurfaceProvider surface={resolved}>
      <section
        {...surfaceAttrs(resolved)}
        className={`${SURFACE_CLASS[resolved]} px-gutter py-band-lg ${DECORATED_BAND_CLASS}`}
      >
        <MoleculeDecoration
          decoration={decoration}
          block="quoteSection"
          surface={resolved}
          className="opacity-10 lg:right-[-203px] lg:top-[181px] lg:w-[699px]"
        />

        {showOrbs ? (
          <>
            {/*
             * Two spheres bleeding off opposite edges (`1683:2139` at −563/258,
             * `1683:2655` at 734/643). On bone they are fine dark line-art with
             * no bloom — OrbitalSphere's `light` tone. Hidden below `lg`, where
             * the 402 frame has room for neither.
             */}
            <OrbitalSphere
              tone="light"
              className="-z-10 hidden lg:left-[-563px] lg:top-[258px] lg:block lg:w-[1155px]"
            />
            <OrbitalSphere
              tone="light"
              className="-z-10 hidden lg:left-[734px] lg:top-[643px] lg:block lg:w-[1304px]"
            />
          </>
        ) : null}

        <blockquote className="max-w-content relative mx-auto flex flex-col gap-6">
          <p className="text-quote font-display text-gradient text-balance">
            &ldquo;{quote}&rdquo;
          </p>
          {attribution ? (
            <footer className="text-display-lg text-fg-quiet max-w-article leading-[1.5em]">
              {attribution}
            </footer>
          ) : null}
        </blockquote>
      </section>
    </SurfaceProvider>
  )
}
