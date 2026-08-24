import { DisplayHeading, SectionShell } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { getCard, type CardComponents } from '../../../cards/card-registry'
import { resolveSurface } from '../../surface'

type ListingSectionProps = SectionProps<'listingSection'> & {
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
 * Section block: lists pages of a `pageType` via their card fieldset
 * (powers /services). The page list is resolved at query time
 * (`SECTION_FIELDS`' listingSection arm), so this stays a pure component.
 */
export function ListingSection({ heading, pages, surface, cardComponents }: ListingSectionProps) {
  const Card = getCard('page', cardComponents)
  return (
    <SectionShell surface={resolveSurface(surface, 'listingSection')}>
      <div className="flex flex-col gap-12 py-24">
        {heading ? <DisplayHeading>{heading}</DisplayHeading> : null}
        <ul className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {(pages ?? []).map((page) => (
            <li key={page._id}>
              <Card {...page} />
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}
