import { SectionShell } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'
import { stegaClean } from '@sanity/client/stega'

import { ButtonLink } from '@/content/ButtonLink'
import { SanityImage } from '@/content/SanityImage'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'
import { fieldAttr, itemAttr } from '@/sanity/dataAttribute'

import { PanelBand } from './PanelBand'
import { PanelCards } from './PanelCards'

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
 *
 * The body row is `PanelBand`, the section's one client boundary: the frame
 * shows the band twice with the second copy at 20% opacity (`1899:4345`),
 * which is a scroll state rather than a second panel, and the band owns the
 * single active index that drives both the rail highlight and the plate fade.
 *
 * ## At 402
 *
 * The mobile frames compose this band differently enough that it belongs
 * beside ADR 0006's three named divergences rather than under them. There is
 * no rail column, no media square and no prose: each panel collapses to a
 * single `ContentPlatform - Mobile` row, 24px apart.
 *
 * | Band      | Frame       | Row                                            |
 * | --------- | ----------- | ---------------------------------------------- |
 * | Platforms | `1814:1691` | wordmark left, ghost "View work →" right       |
 * | Ways      | `1814:1714` | ink block: numeral, then title over its note   |
 *
 * The rail numeral moves **into** the row, because a sticky 82px column has
 * nowhere to stand at 402.
 *
 * ## `layout: cards` — the Solutions band (`1925:6108`), #47
 *
 * The Solutions frame carries **this band**, not a variation on it: the same
 * heading, the same standfirst, the same three engagements. What changes is
 * the arrangement — no rail, no media square, three ink cards side by side —
 * so it is a `layout` axis rather than a second block, the same call
 * `disciplineGridSection` and `inFlightSection` already make.
 *
 * ```
 * 128px 0, gap 65
 *   header  0 96px, space-between, align-END   48px heading in 571 | 24/30 standfirst in 607
 *   row     gap 39                             three cards — see PanelCards
 * ```
 *
 * The header is the same three parts in a different measure, which is why it
 * is one element with two width sets rather than two headers.
 */
export function RailPanelsSection({
  heading,
  intro,
  layout,
  rail,
  panels,
  surface,
  loc,
}: RailPanelsSectionProps) {
  const items = panels ?? []
  const isCards = stegaClean(layout) === 'cards'
  const mode = stegaClean(rail) === 'number' ? 'number' : 'label'
  // Panel `_key`s are unique within the document, so they identify a panel
  // across both halves of the band without the section needing its own id
  // (SectionProps strips `_key` from the section itself).
  const panelId = (key: string | undefined, index: number) => `rail-panel-${key ?? index}`

  const header = (
    <div
      // The band's header surface (#107). There is no `header` object in the
      // schema — the three parts are flat fields — so the wrapper resolves to
      // `heading`, the one that is always the subject when an editor reaches
      // for this region.
      data-sanity={fieldAttr(loc, 'heading')}
      className={cn(
        'flex w-full flex-col gap-6',
        isCards
          ? 'lg:flex-row lg:items-end lg:justify-between lg:gap-8'
          : 'lg:w-[928px] lg:flex-row lg:items-center lg:gap-8',
      )}
    >
      {heading ? (
        <h2
          className={cn(
            'text-display-xl font-display text-balance',
            isCards ? 'lg:w-[571px]' : 'lg:w-[500px]',
          )}
        >
          {heading}
        </h2>
      ) : null}
      {intro ? (
        <p
          className={cn(
            'text-lead leading-[1.2]',
            // 30px against the 24px step on the Solutions band — 1.25 rather
            // than 1.2, and the only value the two headers disagree on.
            isCards ? 'lg:w-[607px] lg:leading-[1.25]' : 'lg:w-[385px]',
          )}
        >
          {intro}
        </p>
      ) : null}
    </div>
  )

  if (isCards) {
    return (
      <SectionShell surface={resolveSurface(surface, 'white')} top="md" bottom="md">
        <div className="flex flex-col gap-10 lg:gap-[65px]">
          {header}
          <PanelCards
            items={items.map((panel, index) => ({
              key: panel._key ?? String(index),
              heading: panel.heading ?? panel.railLabel,
              body: panel.body,
              note: panel.note,
              mark: panel.mark,
              // The card IS the panel, so it carries the panel's own path —
              // the same one the `<article>` in the band layout carries.
              dataSanity: itemAttr(loc, 'panels', panel._key),
            }))}
          />
        </div>
      </SectionShell>
    )
  }

  return (
    <SectionShell surface={resolveSurface(surface, 'white')} top="md" bottom="lg">
      <div className="flex flex-col items-end gap-16 lg:gap-32">
        {header}

        <PanelBand
          mode={mode}
          panelIds={items.map((panel, index) => panelId(panel._key, index))}
          railItems={items.map((panel, index) => ({
            key: panel._key ?? String(index),
            label:
              mode === 'number'
                ? String(index + 1).padStart(2, '0')
                : (panel.railLabel ?? panel.heading ?? ''),
          }))}
        >
          {items.map((panel, index) => (
            <article
              key={panel._key}
              id={panelId(panel._key, index)}
              // The panel's own path — `sections[_key=="…"].panels[_key=="…"]`.
              // `panels` has exactly one member type, so it serialises as an
              // `arrayItem` and resolves natively at this depth (#104).
              data-sanity={itemAttr(loc, 'panels', panel._key)}
              className={cn(
                // At 402 a panel is one compact ROW — `ContentPlatform -
                // Mobile`, drawn twice: `1814:1691` for platforms (a bare
                // row, wordmark left and the link right) and `1814:1714`
                // for ways-to-work (an ink block, numeral left and the
                // title stacked over its note). 24px apart either way.
                //
                // At `lg` both become the full panel: a 500px copy column
                // beside a 395px media square, with the numbering handed
                // back to `PanelRail`.
                'flex items-center lg:flex-row lg:items-center lg:gap-[33px] lg:bg-transparent lg:p-0 lg:text-inherit',
                mode === 'number'
                  ? 'bg-ink gap-3 py-4 pl-4 pr-8 text-white'
                  : 'justify-between gap-4 py-2',
              )}
            >
              {/*
               * The rail numeral, inlined. `PanelRail` is the 1440
               * treatment — a sticky 82px column beside the stack — and it
               * has nowhere to stand at 402, so the mobile row carries its
               * own 68 × 48 numeral box (`1814:1930`).
               */}
              {mode === 'number' ? (
                <span
                  aria-hidden="true"
                  className="flex h-12 w-[68px] shrink-0 items-center justify-center text-[36px] leading-none tracking-[-0.0262em] lg:hidden"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              ) : null}

              {/*
               * `contents` on the platforms row so the wordmark and the
               * link become direct children of the row's `justify-between`
               * — the frame puts them at opposite ends, and the alternative
               * is rendering the same panel twice in the DOM. The column
               * re-forms at `lg`.
               */}
              <div
                className={cn(
                  'min-w-0 lg:flex lg:w-[500px] lg:flex-col lg:gap-12',
                  // 208 in the frame; `flex-1` here, because the frame's
                  // demo note is one line and a real one is three.
                  mode === 'number' ? 'flex flex-1 flex-col' : 'contents',
                )}
              >
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
                    // 177 × 48 in the frame (`1864:2364`), but allowed to
                    // shrink: the frame's link reads "View work" and a real
                    // one reads "View our Sanity work", which is 24px more
                    // row than a 402 phone has.
                    className="h-12 w-auto min-w-0 max-w-[177px] shrink object-contain object-left lg:h-[60px] lg:max-w-none lg:shrink-0"
                  />
                ) : panel.heading ? (
                  // 18/24 Medium in the row (`1814:1719`), the 48px section
                  // step in the panel. `max-lg:` rather than a `lg:` pair
                  // so the desktop step keeps the token's own line-height.
                  <h3 className="text-display-xl font-display text-balance max-lg:text-[18px] max-lg:font-medium max-lg:leading-6">
                    {panel.heading}
                  </h3>
                ) : null}

                {/*
                 * Neither mobile row carries the panel's prose — the frame
                 * drops it at 402 and keeps the note as the one-line gloss.
                 * The only place on either page where the mobile frame
                 * holds LESS content than the desktop one.
                 */}
                {panel.body ? (
                  <p className="text-lead hidden leading-[1.2] lg:block">{panel.body}</p>
                ) : null}
                {panel.note ? (
                  <p
                    className={cn(
                      // 14/24 Medium `#D3D3D3` in the ink row (`1814:1721`).
                      'text-lead text-fg-muted leading-[1.2] max-lg:text-[14px] max-lg:font-medium max-lg:leading-6',
                      mode === 'number' ? 'max-lg:text-on-ink-muted' : 'hidden lg:block',
                    )}
                  >
                    {panel.note}
                  </p>
                ) : null}

                {panel.button ? (
                  // The ways-to-work rows have no button at 402 (`1814:1714`);
                  // the platforms rows put theirs at the far end of the row.
                  <div className={mode === 'number' ? 'hidden lg:block' : 'shrink-0'}>
                    <ButtonLink
                      button={panel.button}
                      // `Button / Ghost` at 402 (`1814:1694` — an 18/24
                      // label and an arrow, no fill), the resolved fill from
                      // `lg` up. One element, so the switch has to be a class
                      // rather than a second variant.
                      className="max-lg:bg-transparent max-lg:px-0 max-lg:text-current"
                    />
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
                  // The media square is a 1440 element: neither 402 frame
                  // draws one, and a full-width photo between every row
                  // would bury the stack.
                  className="hidden lg:block lg:h-[396px] lg:w-[395px] lg:shrink-0"
                />
              ) : (
                // The frame's media slot is a flat #F0F0F0 rectangle on the
                // panels whose image is not chosen yet; holding the space
                // stops the 928px row collapsing onto the copy column.
                <div className="bg-bone hidden lg:block lg:h-[396px] lg:w-[395px] lg:shrink-0" />
              )}
            </article>
          ))}
        </PanelBand>
      </div>
    </SectionShell>
  )
}
