import { DisplayHeading, Eyebrow, SectionShell } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { CtaLink } from '@/content/CtaLink'
import { SanityImage } from '@/content/SanityImage'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type LogoWallBlockProps = SectionProps<'logoWallBlock'>

/**
 * Section block: statement + client logo wall. `layout` picks a grid or a
 * single marquee row (static in the scaffold — the marquee animation is
 * post-scaffold motion work).
 */
export function LogoWallBlock({
  eyebrow,
  statement,
  clients,
  layout,
  cta,
  surface,
}: LogoWallBlockProps) {
  const isMarquee = stegaClean(layout) === 'marquee'
  return (
    <SectionShell surface={resolveSurface(surface, 'bone')}>
      <div className="flex flex-col gap-12 py-24">
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        {statement ? <DisplayHeading>{statement}</DisplayHeading> : null}
        <ul
          className={
            isMarquee
              ? 'flex items-center gap-16 overflow-x-auto'
              : 'grid grid-cols-2 items-center gap-x-16 gap-y-10 sm:grid-cols-3 lg:grid-cols-6'
          }
        >
          {(clients ?? []).map((client) => (
            <li key={client._id} className="shrink-0 opacity-70">
              <SanityImage
                source={client.logo}
                alt={client.name ?? ''}
                width={240}
                height={96}
                className="h-8 w-auto object-contain"
              />
            </li>
          ))}
        </ul>
        {cta ? (
          <div>
            <CtaLink cta={cta} />
          </div>
        ) : null}
      </div>
    </SectionShell>
  )
}
