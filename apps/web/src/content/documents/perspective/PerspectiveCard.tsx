import Link from 'next/link'

import { SanityImage } from '@/content/SanityImage'
import { hrefForDoc } from '@/content/documents/urls'
import { formatNumericDate } from '@/lib/format-date'
import type { SectionProps } from '@/content/blocks/sectionTypes'

/**
 * The perspective card shape — the `PERSPECTIVE_CARD` projection. Pinned to
 * the carousel feed's element type; the collection index's items share the same
 * fragment so they're structurally assignable.
 */
export type PerspectiveCardData = NonNullable<
  SectionProps<'perspectivesCarouselSection'>['latest']
>[number]

/**
 * The perspective card, built to the Home frame's Blog row (`1734:1729`) — #42.
 *
 * ```
 * 394.67 wide, column, gap 24
 *   media   square, --gradient-card-veil over the image (ink 0 → 0.75 at 90%)
 *   info    gap 6
 *     meta  13px / 700 / 0.1em uppercase, #636363 — "3 MINS · 7/27/26"
 *     title 24px regular, #232323
 * ```
 *
 * **The title is 20px at 402** (`1814:1873` / `1814:1887`) against 24 at 1440
 * (`1683:2491`) — both read, so the clamp is solved across the two frame
 * endpoints the way the type tokens are (ADR 0006). It stays a call-site
 * literal rather than a token: the ramp has no 20→24 step, and this is the one
 * component that wants one. Found while building `/perspectives` (#49), which
 * renders this card three-up.
 *
 * There is **no excerpt and no category kicker** on this card: the frame gives
 * it a meta line and a title, and nothing else. The scaffold's version carried
 * a red category kicker, a three-line excerpt and an author/date footer, which
 * is a much denser card than the row is built to hold.
 *
 * `readingMinutes` is derived in GROQ rather than stored — see the projection.
 */
export function PerspectiveCard({
  _type,
  title,
  slug,
  publishedAt,
  featuredImage,
  readingMinutes,
}: PerspectiveCardData) {
  const meta = [
    readingMinutes ? `${readingMinutes} min${readingMinutes === 1 ? '' : 's'}` : null,
    formatNumericDate(publishedAt),
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link href={hrefForDoc({ _type, slug })} className="group flex h-full flex-col gap-6">
      <div className="rounded-card bg-bone relative isolate aspect-square overflow-hidden">
        <SanityImage
          source={featuredImage?.image}
          alt={featuredImage?.alt ?? ''}
          ratio="fill"
          width={800}
          sizes="(min-width: 1024px) 395px, 80vw"
          className="duration-(--duration-reveal) h-full w-full transition-transform ease-out group-hover:scale-[1.03]"
        />
        {/* The veil weights the bottom of the tile, where the frame's pattern
            lozenge sits. It stays even with no image, so an unillustrated
            perspective still reads as a card rather than a blank square. */}
        <div className="bg-(image:--gradient-card-veil) absolute inset-0" />
      </div>

      <div className="flex flex-col gap-1.5">
        {meta ? <p className="text-meta text-fg-muted uppercase">{meta}</p> : null}
        <h3 className="text-fg duration-(--duration-hover) text-[clamp(20px,calc(0.385vw+18.45px),24px)] leading-[1.2] transition-opacity ease-out group-hover:opacity-70">
          {title}
        </h3>
      </div>
    </Link>
  )
}
