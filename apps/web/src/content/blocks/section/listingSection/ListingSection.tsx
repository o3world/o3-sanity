import { DisplayHeading, SectionShell } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { getCard } from '@/content/documents/card-registry'
import { resolveSurface } from '@/content/blocks/surface'

type ListingSectionProps = SectionProps<'listingSection'>

/**
 * Section block: lists pages of a `pageType` via their card fieldset
 * (powers /services). The page list is resolved at query time
 * (`SECTION_FIELDS`' listingSection arm), so this stays a pure component.
 */
export function ListingSection({ heading, pages, surface }: ListingSectionProps) {
  const Card = getCard('page')
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
