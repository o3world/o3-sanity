import { SectionShell } from '@o3/ui'

import { getCard } from '@/content/documents/card-registry'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

import { CarouselTrack } from './CarouselTrack'

type InsightsCarouselSectionProps = SectionProps<'insightsCarouselSection'>

/**
 * Section block: curated-or-latest insights, built to the Home frame's
 * "Blog" band (`1683:2467`) — #42.
 *
 * ```
 * 96px 0, gap 48, bone            ← no horizontal padding; the row bleeds
 *   header  0 96px, space-between   48px heading | two Icon / Surface controls
 *   row     height 526, starts on the 96px gutter, gap 32, runs off the edge
 * ```
 *
 * The frame draws the band with no side padding and the row bleeding past
 * the right edge. That bleed is *not* kept — cards outside the margin read
 * as a layout mistake, and on wide screens a gutter-only band grows far past
 * the design's content column. So the band is an ordinary `SectionShell`:
 * the row lives in the standard 1248px column, which at the design width is
 * exactly the frame's three visible cards (see `CarouselTrack`).
 *
 * The query projects both a `curated` list and a `latest` fallback feed
 * (optionally category-filtered); curated wins when the editor picked any.
 */
export function InsightsCarouselSection({
  heading,
  curated,
  latest,
  surface,
}: InsightsCarouselSectionProps) {
  const items = curated?.length ? curated : (latest ?? [])
  const Card = getCard('insight')

  return (
    <SectionShell surface={resolveSurface(surface, 'bone')} top="sm" bottom="sm">
      <CarouselTrack
        heading={heading}
        cards={items.map((item) => (
          <Card key={item._id} {...item} />
        ))}
      />
    </SectionShell>
  )
}
