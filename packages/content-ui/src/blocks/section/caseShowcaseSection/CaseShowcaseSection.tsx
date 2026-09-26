import { Eyebrow, SurfaceProvider, surfaceAttrs } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { ButtonLink } from '../../../ButtonLink'
import { getCard } from '../../../cards/card-registry'

import { CaseCardStack } from './CaseCardStack'

type CaseShowcaseSectionProps = SectionProps<'caseShowcaseSection'>

/** Home showcase (3720:60492 / 2975:8108), retaining the card stack motion. */
export function CaseShowcaseSection({
  eyebrow,
  heading,
  body,
  button,
  caseStudies,
}: CaseShowcaseSectionProps) {
  const Card = getCard('caseStudy')
  const items = caseStudies ?? []

  return (
    <SurfaceProvider surface="bone">
      <section {...surfaceAttrs('bone')} className="px-gutter bg-bone-soft text-fg py-16 lg:py-32">
        <div className="max-w-section mx-auto flex flex-col gap-16">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
            <div className="flex w-full max-w-[821px] flex-col gap-2">
              {eyebrow ? (
                <Eyebrow size="lg" className="pb-4">
                  {eyebrow}
                </Eyebrow>
              ) : null}
              {heading ? <h2 className="text-hero font-display text-balance">{heading}</h2> : null}
              {body ? <p className="text-lead text-fg-body">{body}</p> : null}
            </div>
            {button ? <ButtonLink button={button} /> : null}
          </div>

          <CaseCardStack>
            {items.map((caseStudy) => (
              /*
               * The wrapper is what stacks, not the card: the card is its own
               * component, so the band cannot pin it directly.
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
