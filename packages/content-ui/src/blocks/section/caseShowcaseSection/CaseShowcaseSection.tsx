import { SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { ButtonLink } from '../../../ButtonLink'
import { getCard, type CardSlot } from '../../../cards/card-registry'

/**
 * The card slot, REQUIRED here: `caseStudy` is app-first
 * (`APP_FIRST_RENDERERS`), so each app hands the band its own card and there
 * is no shared one behind it (ADR 0028).
 *
 * The same channel `LayoutSection`'s `baseComponents` opens for the base tier:
 * this band is a server component on the published path, so an app's card
 * cannot reach it any other way.
 */
type CaseShowcaseSectionProps = SectionProps<'caseShowcaseSection'> & CardSlot<'caseStudy'>

/**
 * Section block: the case-study showcase, built to the Home frame's
 * `Section - Case Studies` band (`1683:2656`) — #324.
 *
 * ONE INK BAND: 1440 × 2014, a vertical stack padded `64px 96px`, gap 64,
 * over a flat `neutral/black` fill. The heading row (`1683:2657`) and the card
 * stack (`1683:2661`) carry no fill of their own.
 *
 * It builds its own `<section>` rather than using `SectionShell` because both
 * of the shell's answers are a step off this band: `BandStep` has no 64 and
 * `SURFACE_CLASS.ink` paints `--color-ink` (#0A0A0B), where the frame binds a
 * pure `#000000`. `SiteFooter` is the same shape for the same reason — black
 * paint, `ink` declared — so the surface roles resolve against the band.
 *
 * The heading row is `space-between` aligned to **flex-end**, so the headline
 * in its 571px measure and the Size=Large button share a baseline.
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
    <SurfaceProvider surface="ink">
      <section {...surfaceAttrs('ink')} className="px-gutter bg-black py-16 text-white">
        <div className="max-w-section mx-auto flex flex-col gap-16">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            {/*
             * The 64px statement step, not the section-headline one: the
             * heading binds `Heading/h1` on both frames (`1683:2659` at 1440,
             * `2975:8110` at 402), which is what `text-hero` carries. It is
             * Light there, and `hero`'s own weight is already 300.
             */}
            {heading ? (
              <h2 className="text-hero font-display max-w-[571px] text-balance">{heading}</h2>
            ) : null}
            {button ? <ButtonLink button={button} size="large" /> : null}
          </div>

          {/*
           * Gap 24 at 402 (`1889:3620`), 48 at 1440 (`1683:2661`). ADR 0006
           * lists this band precisely because it is *not* a composition
           * divergence — both frames stack the cards, and only the gap moves.
           */}
          <div className="flex flex-col gap-6 lg:gap-12">
            {items.map((caseStudy) => (
              <Card key={caseStudy._id} {...caseStudy} />
            ))}
          </div>
        </div>
      </section>
    </SurfaceProvider>
  )
}
