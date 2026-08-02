import { SectionShell } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { CtaLink } from '@/content/CtaLink'
import { SanityImage } from '@/content/SanityImage'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

import { PanelRail } from './PanelRail'

type RailPanelsSectionProps = SectionProps<'railPanelsSection'>

/**
 * Section block: rail + panels, built to the Home frame's two matching bands —
 * "The platforms we go deep on" (`1762:2149`) and "Three ways in" (`1762:2168`)
 * — #42.
 *
 * ```
 * 128px 96px 192px, contents flex-END, 128px between header and body
 *   header  928px wide      48px heading in 500px  |  24px standfirst in 385px
 *   body    row, gap 238    rail 82px              |  panels
 *     panel row, gap 33     copy 500 × 396         |  media 395 × 396
 * ```
 *
 * 82 + 238 + 500 + 33 + 395 = 1248 — the whole band is the standard content
 * column, right-aligned inside it. The scaffold had the rail as a label list
 * above a stack of bordered articles, which is a different layout entirely.
 *
 * The **two bands differ in exactly one thing**: what the rail counts off.
 * That is the `rail` field, not a second block type. Panel numbering derives
 * from array order (CONTEXT.md), so `01` is a position rather than a string
 * someone typed.
 */
export function RailPanelsSection({
  heading,
  intro,
  rail,
  panels,
  surface,
}: RailPanelsSectionProps) {
  const items = panels ?? []
  const mode = stegaClean(rail) === 'number' ? 'number' : 'label'
  // Panel `_key`s are unique within the document, so they identify a panel
  // across both halves of the band without the section needing its own id
  // (SectionProps strips `_key` from the section itself).
  const panelId = (key: string | undefined, index: number) => `rail-panel-${key ?? index}`

  return (
    <SectionShell surface={resolveSurface(surface, 'white')} top="md" bottom="lg">
      <div className="flex flex-col items-end gap-16 lg:gap-32">
        <div className="flex w-full flex-col gap-6 lg:w-[928px] lg:flex-row lg:items-center lg:gap-8">
          {heading ? (
            <h2 className="text-display-xl font-display text-balance lg:w-[500px]">{heading}</h2>
          ) : null}
          {intro ? <p className="text-lead leading-[1.2] lg:w-[385px]">{intro}</p> : null}
        </div>

        <div className="flex w-full gap-8 lg:gap-[238px]">
          <PanelRail
            mode={mode}
            panelIds={items.map((panel, index) => panelId(panel._key, index))}
            items={items.map((panel, index) => ({
              key: panel._key ?? String(index),
              label:
                mode === 'number'
                  ? String(index + 1).padStart(2, '0')
                  : (panel.railLabel ?? panel.heading ?? ''),
            }))}
          />

          <div className="flex min-w-0 flex-1 flex-col gap-24 lg:gap-[164px]">
            {items.map((panel, index) => (
              <article
                key={panel._key}
                id={panelId(panel._key, index)}
                className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:gap-[33px]"
              >
                <div className="flex flex-col gap-6 lg:w-[500px] lg:gap-12">
                  {/*
                   * The platforms band leads with a wordmark, the ways-to-work
                   * band with a 48px heading. They occupy the same slot, which
                   * is why `logo` wins when present rather than sitting above
                   * the heading.
                   */}
                  {panel.logo ? (
                    <SanityImage
                      source={panel.logo}
                      alt={panel.heading ?? panel.railLabel ?? ''}
                      width={640}
                      className="h-12 w-auto object-contain object-left lg:h-[60px]"
                    />
                  ) : panel.heading ? (
                    <h3 className="text-display-xl font-display text-balance">{panel.heading}</h3>
                  ) : null}

                  {panel.body ? <p className="text-lead leading-[1.2]">{panel.body}</p> : null}
                  {panel.note ? (
                    <p className="text-fg-muted text-lead leading-[1.2]">{panel.note}</p>
                  ) : null}

                  {panel.cta ? (
                    <div>
                      <CtaLink cta={panel.cta} arrow />
                    </div>
                  ) : null}
                </div>

                {panel.media ? (
                  <SanityImage
                    source={panel.media.image}
                    alt={panel.media.alt}
                    ratio="1/1"
                    width={790}
                    sizes="(min-width: 1024px) 395px, 100vw"
                    className="w-full lg:h-[396px] lg:w-[395px] lg:shrink-0"
                  />
                ) : (
                  // The frame's media slot is a flat #F0F0F0 rectangle on the
                  // panels whose image is not chosen yet; holding the space
                  // stops the 928px row collapsing onto the copy column.
                  <div className="bg-bone hidden lg:block lg:h-[396px] lg:w-[395px] lg:shrink-0" />
                )}
              </article>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  )
}
