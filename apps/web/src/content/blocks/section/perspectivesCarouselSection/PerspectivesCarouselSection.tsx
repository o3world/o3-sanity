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
 * gutter and the card row starts on the same line, then continues past the
 * right edge. That overhang is the affordance — it is what says the row
 * scrolls, and it is why this is not a centred container.
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
