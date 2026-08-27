import Link from 'next/link'

import {
  CARD_ARROW_NUDGE,
  CARD_LINK_FOCUS,
  CARD_TITLE_FADE,
  SurfaceProvider,
  cn,
  surfaceAttrs,
} from '@o3/ui'
import { hrefForDoc } from '@o3/content-runtime/urls'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { SanityImage } from '../SanityImage'

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
        // The offset is transparent because a `listingSection` on ink puts this
        // white card on a dark band, and the gap has to show the band rather
        // than a white notch on it.
        className={cn(
          'rounded-card border-line group flex h-full flex-col gap-4 border bg-white p-8',
          CARD_LINK_FOCUS,
          'focus-visible:ring-offset-transparent',
        )}
      >
        {card?.icon ? (
          <SanityImage
            source={card.icon}
            alt=""
            width={96}
            className="h-10 w-10 object-contain"
            // The icon renders at 40px at every width.
            sizes="40px"
          />
        ) : null}
        <h3 className={cn('text-fg text-lg font-medium', CARD_TITLE_FADE)}>
          {card?.shortTitle ?? title}
        </h3>
        {card?.excerpt ? <p className="text-fg-muted text-sm">{card.excerpt}</p> : null}
        <span className="text-brand mt-auto text-sm font-medium">
          Learn more{' '}
          {/* The glyph is the card's trailing arrow, so it takes the nudge; it
              needs a box of its own to be translated in. */}
          <span className={cn('inline-block', CARD_ARROW_NUDGE)}>→</span>
        </span>
      </Link>
    </SurfaceProvider>
  )
}
