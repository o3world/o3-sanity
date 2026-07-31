import Link from 'next/link'

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
    <Link
      href={hrefForDoc({ _type, slug })}
      className="rounded-card border-line flex h-full flex-col gap-4 border bg-white p-8"
    >
      {card?.icon ? (
        <SanityImage
          source={card.icon}
          alt=""
          width={96}
          height={96}
          className="h-10 w-10 object-contain"
        />
      ) : null}
      <h3 className="text-fg text-lg font-medium">{card?.shortTitle ?? title}</h3>
      {card?.excerpt ? <p className="text-fg-muted text-sm">{card.excerpt}</p> : null}
      <span className="text-brand mt-auto text-sm font-medium">Learn more →</span>
    </Link>
  )
}
