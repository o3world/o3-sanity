import { SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { ButtonLink } from '../../../ButtonLink'
import { getCard, type CardComponents } from '../../../cards/card-registry'

type CaseShowcaseSectionProps = SectionProps<'caseShowcaseSection'> & {
  /**
   * The card table this band draws through, so an app can re-point one card
   * type without forking the band (ADR 0028). An unbound type falls back to
   * the shared card.
   *
   * The same channel `LayoutSection`'s `baseComponents` opens for the base
   * tier: this band is a server component on the published path, so an app's
   * card cannot reach it any other way.
   */
  cardComponents?: CardComponents
}

/**
 * Section block: the case-study showcase, built to the Home frame's "Case
 * Studies" band (`1683:2656`) — #42.
 *
 * Two stacked bands, each with **its own gradient**, which is why this builds
 * its own `<section>` rather than using `SectionShell`:
 *
 * | Band                   | Frame       | Fill                             |
 * | ---------------------- | ----------- | -------------------------------- |
 * | Heading, `96px 96px 0` | `1683:2657` | `--gradient-surface-wash`        |
 * | Cards, `96px`, gap 48  | `1683:2661` | `--gradient-surface-wash-angled` |
 *
 * The heading row is `space-between` aligned to **flex-end**, so the 48px
 * headline in its 571px measure and the Size=Large button share a baseline.
 *
 * The block offers no `surface`: the frame paints this band with the two
 * washes, and a flat fill behind them would show through both. A dark
 * treatment, if a page ever wants one, is a second `variant` — not a surface.
 */
export function CaseShowcaseSection({
  heading,
  button,
  caseStudies,
  cardComponents,
}: CaseShowcaseSectionProps) {
  const Card = getCard('caseStudy', cardComponents)
  const items = caseStudies ?? []

  return (
    // Both washes are light and the band takes `text-fg`, so it declares
    // `white` — the surface a reader sees, spelled here because the block has
    // no field to read it from.
    <SurfaceProvider surface="white">
      <section {...surfaceAttrs('white')} className="text-fg">
        <div className="bg-(image:--gradient-surface-wash) px-gutter pt-band-sm">
          <div className="max-w-section mx-auto flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            {heading ? (
              <h2 className="text-display-xl font-display max-w-[571px] text-balance">{heading}</h2>
            ) : null}
            {button ? <ButtonLink button={button} size="large" /> : null}
          </div>
        </div>

        <div className="bg-(image:--gradient-surface-wash-angled) px-gutter py-band-sm">
          {/*
           * Gap 24 at 402 (`1889:3620`), 48 at 1440 (`1683:2661`). ADR 0006
           * lists this band precisely because it is *not* a composition
           * divergence — both frames stack the cards, and only the gap moves.
           */}
          <div className="max-w-section mx-auto flex flex-col gap-6 lg:gap-12">
            {items.map((caseStudy) => (
              <Card key={caseStudy._id} {...caseStudy} />
            ))}
          </div>
        </div>
      </section>
    </SurfaceProvider>
  )
}
