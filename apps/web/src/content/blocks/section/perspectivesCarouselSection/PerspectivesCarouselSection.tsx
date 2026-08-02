import { SURFACE_CLASS } from '@o3/ui'

import { getCard } from '@/content/documents/card-registry'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

import { CarouselTrack } from './CarouselTrack'

type PerspectivesCarouselSectionProps = SectionProps<'perspectivesCarouselSection'>

/**
 * Section block: curated-or-latest perspectives, built to the Home frame's
 * "Blog" band (`1683:2467`) — #42.
 *
 * ```
 * 96px 0, gap 48, bone            ← no horizontal padding; the row bleeds
 *   header  0 96px, space-between   48px heading | two Icon / Surface controls
 *   row     height 526, starts on the 96px gutter, gap 32, runs off the edge
 * ```
 *
 * The band has **no side padding of its own**: the header is inset by the
 * gutter and the card row starts on the same line. The frame then runs the
 * row past the right edge, but that bleed is *not* kept — cards outside the
 * margin read as a layout mistake, so the track clips at the gutter lines
 * and the partially-visible next card carries the "this scrolls" affordance
 * instead (see `CarouselTrack`).
 *
 * The query projects both a `curated` list and a `latest` fallback feed
 * (optionally category-filtered); curated wins when the editor picked any.
 */
export function PerspectivesCarouselSection({
  heading,
  curated,
  latest,
  surface,
}: PerspectivesCarouselSectionProps) {
  const items = curated?.length ? curated : (latest ?? [])
  const Card = getCard('perspective')

  return (
    <section
      className={`${SURFACE_CLASS[resolveSurface(surface, 'bone')]} py-band-sm overflow-hidden`}
    >
      <CarouselTrack
        heading={heading}
        cards={items.map((item) => (
          <Card key={item._id} {...item} />
        ))}
      />
    </section>
  )
}
