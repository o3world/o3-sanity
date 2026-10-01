import Link from 'next/link'
import { useId } from 'react'

import { CARD_LINK_FOCUS, CARD_MEDIA_ZOOM, CARD_TITLE_FADE, cn } from '@o3/ui'

import { hrefForDoc } from '@o3/content-runtime/urls'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { SanityImage } from '../SanityImage'
import { CARD_THREE_UP, STRUCTURAL_THREE_UP } from '../imageSizes'
import { formatLongDate } from '../lib/format-date'

export type InsightCardData = NonNullable<SectionProps<'insightsCarouselSection'>['latest']>[number]

/** Current Blog Post Card (3739:71754): square media, 24px gap, and Body/Small title. */
export function InsightCard({
  _type,
  title,
  slug,
  publishedAt,
  cardMedia,
  readingMinutes,
  priority,
  mediaLayout = 'fixed-card',
}: InsightCardData & {
  /**
   * Preload this card's picture. Only the container knows whether the card is
   * the route's LCP candidate — the `/insights` grid passes it for the first
   * card and nothing else does, because the carousel bands sit below the fold.
   */
  priority?: boolean
  /**
   * The two real slots this shared card occupies. The default preserves the
   * fixed 395px carousel/retired-app tile; O3's collection index opts into its
   * structural three-up cell at `lg` without widening the one-column tablet
   * state.
   */
  mediaLayout?: 'fixed-card' | 'structural-three-up'
}) {
  const isStructural = mediaLayout === 'structural-three-up'
  const meta = [
    formatLongDate(publishedAt),
    readingMinutes ? `${readingMinutes} min${readingMinutes === 1 ? '' : 's'}` : null,
  ]
    .filter(Boolean)
    .join(' · ')
  // The whole card is the link, so its title names it rather than the
  // picture's alt and the date line as well.
  const titleId = useId()

  return (
    <Link
      href={hrefForDoc({ _type, slug })}
      aria-labelledby={titleId}
      // The offset is transparent because the band under this card is
      // authored: `insightsCarouselSection` resolves its own surface, so the
      // gap has to show whatever the band paints rather than a white notch on
      // ink.
      className={cn(
        'group flex h-full flex-col gap-6',
        CARD_LINK_FOCUS,
        'focus-visible:ring-offset-transparent',
      )}
    >
      <div
        className={cn(
          'bg-bone relative isolate aspect-square w-full overflow-hidden rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.2)] sm:max-w-[395px]',
          isStructural && 'lg:max-w-none',
        )}
      >
        <SanityImage
          source={cardMedia?.image}
          alt={cardMedia?.alt ?? ''}
          ratio="fill"
          width={800}
          sizes={isStructural ? STRUCTURAL_THREE_UP : CARD_THREE_UP}
          priority={priority}
          className={cn('h-full w-full', CARD_MEDIA_ZOOM)}
        />
      </div>

      <div className="flex flex-col gap-2">
        {meta ? <p className="text-meta text-fg-muted uppercase">{meta}</p> : null}
        <h3 id={titleId} className={cn('text-fg text-body', CARD_TITLE_FADE)}>
          {title}
        </h3>
      </div>
    </Link>
  )
}
