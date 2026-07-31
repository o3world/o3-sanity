import { ArrowLink, DisplayHeading, Eyebrow, SectionShell } from '@o3/ui'

import { resolveCtaHref } from '@/content/CtaLink'
import { SanityImage } from '@/content/SanityImage'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type RailPanelsBlockProps = SectionProps<'railPanelsBlock'>

/**
 * Section block: rail + panels — serves both the "platforms we go deep on"
 * and "how we work" moments. The scaffold renders the rail as an in-page
 * label list and the panels as a stacked sequence; the scroll-synced rail
 * highlight is post-scaffold motion work.
 */
export function RailPanelsBlock({ heading, intro, panels, surface }: RailPanelsBlockProps) {
  return (
    <SectionShell surface={resolveSurface(surface, 'white')}>
      <div className="grid gap-16 py-24 lg:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-8 self-start lg:sticky lg:top-32">
          {heading ? <DisplayHeading>{heading}</DisplayHeading> : null}
          {intro ? <p className="text-fg-muted max-w-md">{intro}</p> : null}
          <ol className="flex flex-col gap-3">
            {(panels ?? []).map((panel) => (
              <li key={panel._key} className="eyebrow text-fg-subtle">
                {panel.railLabel}
              </li>
            ))}
          </ol>
        </div>
        <div className="flex flex-col gap-20">
          {(panels ?? []).map((panel) => (
            <article key={panel._key} className="border-line flex flex-col gap-4 border-t pt-8">
              {panel.railLabel ? <Eyebrow>{panel.railLabel}</Eyebrow> : null}
              {panel.logo ? (
                <SanityImage
                  source={panel.logo}
                  alt={panel.heading ?? panel.railLabel ?? ''}
                  width={320}
                  height={120}
                  className="h-10 w-auto object-contain"
                />
              ) : panel.heading ? (
                <h3 className="text-display-lg font-display">{panel.heading}</h3>
              ) : null}
              {panel.body ? <p className="text-fg-muted max-w-xl">{panel.body}</p> : null}
              {panel.note ? <p className="text-fg-subtle text-sm">{panel.note}</p> : null}
              {panel.media ? (
                <SanityImage
                  source={panel.media.image}
                  alt={panel.media.alt}
                  width={1200}
                  className="rounded-card mt-4 w-full"
                  sizes="(min-width: 1024px) 60vw, 100vw"
                />
              ) : null}
              {panel.cta?.label ? (
                <div className="mt-2">
                  <ArrowLink href={resolveCtaHref(panel.cta)}>{panel.cta.label}</ArrowLink>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}
