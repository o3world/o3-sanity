import { SectionShell } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { fieldAttr } from '@o3/content-runtime/data-attribute'

import { getCard, type CardSlot } from '../../../cards/card-registry'
import { resolveSurface } from '../../surface'

import { CAROUSEL_BAND_CLASS } from './carouselBand'
import { CarouselTrack } from './CarouselTrack'

/**
 * The card slot: how an app re-points this band's card without forking the
 * band (ADR 0028). Optional while `insight` has a shared card, and required
 * the moment `APP_FIRST_RENDERERS` demotes it — there would be nothing left to
 * fall back to.
 *
 * The same channel `LayoutSection`'s `baseComponents` opens for the base tier:
 * this band is a server component on the published path, so an app's card
 * cannot reach it any other way.
 */
type InsightsCarouselSectionProps = SectionProps<'insightsCarouselSection'> & CardSlot<'insight'>

/**
 * Section block: curated-or-latest insights, built to the Home frame's
 * "Blog" band (`2134:1352`, an instance of the Blog set `2205:1146`) — #42.
 *
 * ```
 * 1440 × 749, padding 128 0, gap 48, bone   ← no horizontal padding; row bleeds
 *   header  0 96px, space-between            48px heading | two Icon / Surface controls
 *   row     height 526, starts on the 96px gutter, gap 32, runs off the edge
 * ```
 *
 * An ordinary `SectionShell` puts the header and the head of the row on the
 * standard 1248px column; the track's viewport reaches past it to the right
 * edge of the screen, which is the frame's own row (#401, and see
 * `CarouselTrack`). The shell carries `CAROUSEL_BAND_CLASS` because that bleed
 * is measured in `vw`.
 *
 * The query projects both a `curated` list and a `latest` fallback feed
 * (optionally category-filtered); curated wins when the editor picked any.
 */
export function InsightsCarouselSection({
  heading,
  curated,
  latest,
  surface,
  loc,
  cardComponents,
}: InsightsCarouselSectionProps) {
  const items = curated?.length ? curated : (latest ?? [])
  const Card = getCard('insight', cardComponents)

  return (
    <SectionShell
      surface={resolveSurface(surface, 'insightsCarouselSection')}
      top="md"
      bottom="md"
      className={CAROUSEL_BAND_CLASS}
    >
      <CarouselTrack
        heading={heading}
        headingAttr={fieldAttr(loc, 'heading')}
        cards={items.map((item) => (
          <Card key={item._id} {...item} />
        ))}
      />
    </SectionShell>
  )
}
