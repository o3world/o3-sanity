import Link from 'next/link'

import { SurfaceProvider, surfaceAttrs } from '@o3/ui'

import { SanityImage } from '@/content/SanityImage'
import { hrefForDoc } from '@/content/documents/urls'
import type { SectionProps } from '@/content/blocks/sectionTypes'

/**
 * The page card shape — the listingSection projection element (the service
 * pages' conditional `card` fieldset: shortTitle, excerpt, icon).
 */
export type PageCardData = NonNullable<SectionProps<'listingSection'>['pages']>[number]

export function PageCard({ _type, title, slug, card }: PageCardData) {
  return (
    // THE CARD PAINTS WHITE, SO IT DECLARES WHITE — both halves, because a
    // `listingSection` on ink puts this card on a dark band and the card is
    // the nearest thing actually behind its own copy. Without the attribute
    // `text-fg` inherits the band's inverted role and draws white on white;
    // without the provider a button added here would resolve Auto against the
    // band and come back light, on the same white fill.
    <SurfaceProvider surface="white">
      <Link
        href={hrefForDoc({ _type, slug })}
        {...surfaceAttrs('white')}
        className="rounded-card border-line flex h-full flex-col gap-4 border bg-white p-8"
      >
        {card?.icon ? (
          <SanityImage source={card.icon} alt="" width={96} className="h-10 w-10 object-contain" />
        ) : null}
        <h3 className="text-fg text-lg font-medium">{card?.shortTitle ?? title}</h3>
        {card?.excerpt ? <p className="text-fg-muted text-sm">{card.excerpt}</p> : null}
        <span className="text-brand mt-auto text-sm font-medium">Learn more →</span>
      </Link>
    </SurfaceProvider>
  )
}
