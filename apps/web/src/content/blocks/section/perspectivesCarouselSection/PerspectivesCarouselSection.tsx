import { DisplayHeading, SectionShell } from '@o3/ui'

import { getCard } from '@/content/documents/card-registry'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type PerspectivesCarouselSectionProps = SectionProps<'perspectivesCarouselSection'>

/**
 * Section block: curated-or-latest perspectives. The query projects both a
 * `curated` list (dereferenced refs) and a `latest` fallback feed (optionally
 * category-filtered); curated wins when the editor picked any. Rendered as a
 * horizontally scrollable row — carousel controls are post-scaffold work.
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
    <SectionShell surface={resolveSurface(surface, 'bone')}>
      <div className="flex flex-col gap-12 py-24">
        {heading ? <DisplayHeading>{heading}</DisplayHeading> : null}
        <ul className="-mx-2 flex snap-x gap-6 overflow-x-auto px-2 pb-4">
          {items.map((item) => (
            <li key={item._id} className="w-80 shrink-0 snap-start">
              <Card {...item} />
            </li>
          ))}
        </ul>
      </div>
    </SectionShell>
  )
}
