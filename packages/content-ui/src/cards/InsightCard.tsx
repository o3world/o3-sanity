import Link from 'next/link'

import { CARD_LINK_FOCUS, CARD_MEDIA_ZOOM, CARD_TITLE_FADE, cn } from '@o3/ui'
import { brandConfig } from '@o3/sanity/brand'

import { hrefForDoc } from '@o3/content-runtime/urls'
import type { SectionProps } from '@o3/content-runtime/blocks'

import { SanityImage } from '../SanityImage'
import { CARD_THREE_UP } from '../imageSizes'
import { formatNumericDate } from '../lib/format-date'

/**
 * Whether the brand this app runs as prints a publication date at all. o3xo's
 * insights carry a synthetic one that orders the collection and says nothing
 * about when anything was published (#218), so its cards draw the reading time
 * alone. Read once at module scope: `NEXT_PUBLIC_BRAND` is fixed for a build.
 */
const { showsPublishDates } = brandConfig()

/**
 * The insight card shape — the `INSIGHT_CARD` projection. Pinned to
 * the carousel feed's element type; the collection index's items share the same
 * fragment so they're structurally assignable.
 */
export type InsightCardData = NonNullable<SectionProps<'insightsCarouselSection'>['latest']>[number]

/**
 * The insight card, built to the Home frame's Blog row (`1734:1729`) — #42.
 *
 * ```
 * 394.67 wide, column, gap 24
 *   media   square, --gradient-card-veil over the image (ink 0 → 0.75 at 90%)
 *   info    gap 6
 *     meta  13px / 700 / 0.1em uppercase, fg-muted (#76746F since the 2026-08
 *     warm shift; the frame's meta binds that variable) — "3 MINS · 7/27/26"
 *     title 24px regular, #232323
 * ```
 *
 * **The title is 20px at 402** (`1814:1873` / `1814:1887`) against 24 at 1440
 * (`1683:2491`) — both read, so the clamp is solved across the two frame
 * endpoints and lives on `--text-display-sm`: one call site, but ADR 0006 puts
 * every solved clamp in the ramp rather than a `className` (the `--text-quote`
 * precedent). Found while building `/insights` (#49), which renders this
 * card three-up.
 *
 * There is **no excerpt and no category kicker** on this card: the frame gives
 * it a meta line and a title, and nothing else. The scaffold's version carried
 * a red category kicker, a three-line excerpt and an author/date footer, which
 * is a much denser card than the row is built to hold.
 *
 * `readingMinutes` is derived in GROQ rather than stored — see the projection.
 */
export function InsightCard({
  _type,
  title,
  slug,
  publishedAt,
  featuredImage,
  readingMinutes,
  priority,
}: InsightCardData & {
  /**
   * Preload this card's picture. Only the container knows whether the card is
   * the route's LCP candidate — the `/insights` grid passes it for the first
   * card and nothing else does, because the carousel bands sit below the fold.
   */
  priority?: boolean
}) {
  const meta = [
    readingMinutes ? `${readingMinutes} min${readingMinutes === 1 ? '' : 's'}` : null,
    showsPublishDates ? formatNumericDate(publishedAt) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link
      href={hrefForDoc({ _type, slug })}
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
      <div className="rounded-card bg-bone relative isolate aspect-square overflow-hidden">
        <SanityImage
          source={featuredImage?.image}
          alt={featuredImage?.alt ?? ''}
          ratio="fill"
          width={800}
          sizes={CARD_THREE_UP}
          priority={priority}
          className={cn('h-full w-full', CARD_MEDIA_ZOOM)}
        />
        {/* The veil weights the bottom of the tile, where the frame's pattern
            lozenge sits. It stays even with no image, so an unillustrated
            insight still reads as a card rather than a blank square. */}
        <div className="bg-(image:--gradient-card-veil) absolute inset-0" />
      </div>

      <div className="flex flex-col gap-1.5">
        {meta ? <p className="text-meta text-fg-muted uppercase">{meta}</p> : null}
        <h3 className={cn('text-fg text-display-sm', CARD_TITLE_FADE)}>{title}</h3>
      </div>
    </Link>
  )
}
