import { OrbitalSphere, SURFACE_CLASS } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

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
 */
export function QuoteSection({ quote, attribution, decoration, surface }: QuoteSectionProps) {
  if (!quote) return null
  const showOrbs = stegaClean(decoration) !== 'none'

  return (
    <section
      className={`${SURFACE_CLASS[resolveSurface(surface, 'bone')]} px-gutter py-band-lg relative isolate overflow-hidden`}
    >
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
        <p className="text-hero font-display text-gradient text-balance">&ldquo;{quote}&rdquo;</p>
        {attribution ? (
          <footer className="text-display-lg text-fg-quiet max-w-article leading-[1.5em]">
            {attribution}
          </footer>
        ) : null}
      </blockquote>
    </section>
  )
}
