import { SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { ButtonLink } from '../../../ButtonLink'
import { getCard, type CardSlot } from '../../../cards/card-registry'

import { CaseCardStack } from './CaseCardStack'

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
 *
 * From the desktop breakpoint up the cards stack rather than scroll past: each
 * pins under the chrome and the next slides over it, dimming what it covers
 * (`CaseCardStack`). Figma draws a still and cannot say this; the sequence
 * comes from the retired design prototype.
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

          <CaseCardStack>
            {items.map((caseStudy) => (
              /*
               * The wrapper is what stacks, not the card: `caseStudy` is
               * app-first, so the band knows nothing about what it was handed
               * and cannot pin it directly.
               *
               * `top-40` is the clearance the sticky rail in `PanelBand`
               * already uses — the nav floats at `top-[64px]` and stands about
               * 60 tall, so a card pins clear of it rather than under it.
               *
               * The wrapper paints the band's own black because a card is only
               * a stack if it is opaque: O3's card is a photograph with no
               * ground of its own behind it, and a missing image would leave
               * the card beneath showing through the card on top.
               *
               * `lg:` only. The cards run past 550px tall and a phone viewport
               * is barely twice that, so pinning them would leave a reader
               * scrolling a card that never leaves. Below the breakpoint the
               * band is the flat stack it has always been, and the dim reads
               * the computed `position` and turns itself off.
               */
              <div
                key={caseStudy._id}
                className="bg-black lg:sticky lg:top-[calc(var(--spacing-nav-pinned)+96px)]"
              >
                <Card {...caseStudy} />
              </div>
            ))}
          </CaseCardStack>
        </div>
      </section>
    </SurfaceProvider>
  )
}
