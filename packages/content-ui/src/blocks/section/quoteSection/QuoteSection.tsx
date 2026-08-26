import type { ReactNode } from 'react'

import { OrbitalSphere, SURFACE_CLASS, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { DECORATED_BAND_CLASS, resolveDecoration } from '../../decoration'
import { MoleculeDecoration } from '../../MoleculeDecoration'
import { resolveSurface } from '../../surface'

type QuoteSectionProps = SectionProps<'quoteSection'> & {
  /**
   * The band's `eyebrow`, drawn by the app that binds this renderer: O3XO
   * fills it with the kit's header pill (`4414:8100`), and O3's binding leaves
   * it empty, because no O3 frame puts a label over a quote. A slot rather
   * than the stored string, since what the two brands disagree about is the
   * chrome around those words, not the words.
   */
  eyebrowSlot?: ReactNode
}

/**
 * Section block: the pull quote, built to the `Quote` set (`2748:4672`), which
 * Home instances at both widths — `2748:4767` at 1440 × 1012, `2748:4804` at
 * 402 × 804.
 *
 * `192px 96px` at 1440 and `128px 16px` at 402, and inside it a **1034px**
 * column (`--container-content`, node `2748:4838`) with 48px between the two
 * parts, 24px at 402 (`2748:4689`):
 *
 * - **Quote** — `--text-quote`: 64/76 Light at -1px of tracking, 36/44 at 402.
 * - **Attribution** — an eyebrow: 18/24 bold uppercase on 0.1em of
 *   tracking in `--color-fg-muted` (#76746F, variable `2083:1073`), 16/20 at
 *   402. `eyebrow-lg`, the same step "OUR PARTNERS" rides.
 *
 * Both are **centred**, on a centred column (`2748:4839`, `2748:4840`).
 *
 * The quotation marks belong to the frame's string, so they are added here
 * rather than stored: an editor should not have to remember to type the
 * glyphs, and a typed `"` would render as a straight quote.
 *
 * The quote is solid `text-fg` — the set fills it #232323, Figma's
 * `text/default` (`2748:4839`). The case-study detail's loose band
 * (`2250:1527`) still draws `--gradient-statement`; that band is a generation
 * behind this set and the set wins (Nick, 2026-08-25). The gradient token
 * survives on the partners intro.
 *
 * **`decoration: 'molecule'`** swaps the two spheres for the molecule mark —
 * 776px at 10%, hung off the band's bottom-left corner and clipped by its
 * `overflow-hidden`. The offsets are read off the two Home instances.
 *
 * It is the one decoration on this band that survives 402: the mobile frame
 * hangs the full 776px off the corner and lets the gutter clip it, where the
 * spheres would fill the band instead of sitting behind it.
 */
export function QuoteSection({
  quote,
  attribution,
  decoration,
  surface,
  eyebrowSlot,
}: QuoteSectionProps) {
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
          // 167 past the gutter and 546 below the band at 402; 128 and 374 at
          // 1440, where the band is taller and the glyph rides higher in it.
          className="bottom-[-546px] left-[-167px] w-[776px] opacity-10 lg:bottom-[-374px] lg:left-[-128px]"
          visibleFrom="base"
        />

        {showOrbs ? (
          <>
            {/*
             * Two spheres bleeding off opposite edges (`1683:2139` at −563/258,
             * `1683:2655` at 734/643). On bone they are fine dark line-art with
             * no bloom — OrbitalSphere's `light` tone. Hidden below `lg`, where
             * the 402 frame has room for neither.
             */}
            {/*
             * Ratios against the 1440 frame rather than its pixels, so the pair
             * holds its composition across the whole range where `lg` is live
             * instead of only at the design width (ADR 0006).
             *
             *   -563/258/1155 → -39.10 / 17.92 / 80.21vw
             *    734/643/1304 →  50.97 / 44.65 / 90.56vw
             */}
            <OrbitalSphere
              preset="line"
              className="-z-10 hidden lg:left-[-39.1vw] lg:top-[17.92vw] lg:block lg:w-[80.21vw]"
            />
            <OrbitalSphere
              preset="line"
              className="-z-10 hidden lg:left-[50.97vw] lg:top-[44.65vw] lg:block lg:w-[90.56vw]"
            />
          </>
        ) : null}

        {/* Above the quote, on the same column — 32px clear of it, the gap the
            kit's Quote Block sets (`4404:4920`). An unfilled slot adds no
            markup, so a band with no label is the band it always was. */}
        {eyebrowSlot ? (
          <div className="max-w-content relative mx-auto mb-8">{eyebrowSlot}</div>
        ) : null}

        <blockquote className="max-w-content relative mx-auto flex flex-col gap-6 text-center lg:gap-12">
          <p className="text-quote font-display text-fg text-balance">&ldquo;{quote}&rdquo;</p>
          {attribution ? <footer className="eyebrow-lg text-fg-muted">{attribution}</footer> : null}
        </blockquote>
      </section>
    </SurfaceProvider>
  )
}
