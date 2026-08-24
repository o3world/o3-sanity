import type { ComponentType } from 'react'

import { SectionShell } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { fieldAttr, itemAttr } from '@o3/content-runtime/data-attribute'
import { stegaClean } from '@sanity/client/stega'

import { ButtonLink } from '../../../ButtonLink'
import { SanityImage } from '../../../SanityImage'
import { sectionBackground } from '../../sectionBackground'
import { resolveSurface } from '../../surface'

import { PanelBand } from './PanelBand'
import { PanelCards, type PanelCard } from './PanelCards'
import { PanelGrid } from './PanelGrid'
import { PanelPlate } from './PanelPlate'
import { PanelRows } from './PanelRows'
import { PanelTrack } from './PanelTrack'
import { STATEMENT_STEP } from './statementStep'

/**
 * The four measures the band's header comes in. Every layout draws the same
 * heading and standfirst; what differs is the step and the column each gets,
 * and both are read off the frame the layout answers to.
 *
 * - `spread` — the rail band: the full column, heading over 571 and standfirst
 *   over 385, pushed apart and centred against each other (`2747:4487`). The
 *   one header on the 48 → 64 statement step rather than `display-xl`.
 * - `measured` — the rows and grid bands: a 928px header, heading over 500 and
 *   standfirst over 385 (`1762:2149`).
 * - `wide` — the Solutions cards band: the full column, 571 and 607, baselines
 *   aligned at the foot (`1925:6108`).
 * - `split` — the track: the full column, the heading hugging its words and
 *   the standfirst holding the far edge in 340 (`2846:5480`).
 */
const HEADER_SHAPE = {
  spread: {
    // 24 between the two at 402 (`2975:8189`), 64 apart across the row at 1440.
    wrapper: 'gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-16',
    heading: `${STATEMENT_STEP} lg:w-[571px]`,
    // 24/34 on both frames — flat, so `text-lead`'s 20px floor would undersize
    // it at 402.
    intro: 'text-[24px] leading-[34px] lg:w-[385px]',
  },
  measured: {
    wrapper: 'gap-6 lg:w-[928px] lg:flex-row lg:items-center lg:gap-8',
    heading: 'text-display-xl lg:w-[500px]',
    intro: 'text-lead leading-[1.2] lg:w-[385px]',
  },
  wide: {
    wrapper: 'gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8',
    heading: 'text-display-xl lg:w-[571px]',
    // 30px against the 24px step on the Solutions band — 1.25 rather than
    // 1.2, and the only value the three headers disagree on.
    intro: 'text-lead leading-[1.2] lg:w-[607px] lg:leading-[1.25]',
  },
  split: {
    // 18 between the heading and the standfirst at 402 (`2975:8355`), where
    // every other band takes 24.
    wrapper: 'gap-[18px] lg:flex-row lg:items-start lg:justify-between lg:gap-8',
    heading: 'text-display-xl',
    // 20/32 on both of the track's frames — flat, so `text-body`'s 16px floor
    // would undersize it at 402.
    intro: 'text-[20px] leading-8 lg:w-[340px]',
  },
} as const

type RailPanelsSectionProps = SectionProps<'railPanelsSection'> & {
  /**
   * The row the `cards` layout draws, so an app can hand the band its own
   * card without forking the band (ADR 0028). O3XO fills it with the kit's
   * `Yellow Text Card`, whose plate is a token role only its own package
   * declares (#244); unfilled, the band draws the cards it always has.
   */
  panelCards?: ComponentType<{ items: PanelCard[] }>
}

/**
 * Section block: rail + panels — an ordered set of parallel things, in five
 * arrangements. The rail composition below is Home's "The platforms we go deep
 * on" (`2747:4486` at 1440, `2975:8188` at 402), #310.
 *
 * ```
 * 128px 96px 128px, 128 between header and body
 *   header  full column      64px heading in 571  |  24px standfirst in 385
 *   body    row, gap 238     rail 82px            |  panels, 128 apart
 *     panel row, gap 33      copy 500             |  plate 395 × 396
 * ```
 *
 * 82 + 238 + 500 + 33 + 395 = 1248 — the whole band is the standard content
 * column. If it ever stops adding up, that sum is where to start.
 *
 * What the rail counts off is the `rail` field, not a second block type. Panel
 * numbering derives from array order (CONTEXT.md), so `01` is a position
 * rather than a string someone typed.
 *
 * The body row is `PanelBand`, the section's one client boundary: it owns the
 * scroll-linked index that tells the rail which stop is in view.
 *
 * ## At 402
 *
 * The label rail keeps every part it has at 1440 and re-lays them: the rail
 * becomes a tab row over the panels (`PanelRail`) and each panel stacks its
 * plate under its copy (`PanelPlate`). That is a reflow, not a second
 * composition — see ADR 0006's 2026-08-24 amendment.
 *
 * The number rail is the one that still switches: no rail column, no media
 * square and no prose, each panel collapsing to a single ink row 24px from
 * the next (`1814:1714`), with the numeral moved into the row because a
 * sticky 82px column has nowhere to stand.
 *
 * ## `layout: cards` — the Solutions band (`1925:6108`), #47
 *
 * The Solutions frame carries **this band**, not a variation on it: the same
 * heading, the same standfirst, the same three engagements. What changes is
 * the arrangement — no rail, no media square, three ink cards side by side —
 * so it is a `layout` axis rather than a second block, the same call
 * `featureGridSection` and `inFlightSection` already make.
 *
 * ```
 * 128px 0, gap 65
 *   header  0 96px, space-between, align-END   48px heading in 571 | 24/30 standfirst in 607
 *   row     gap 39                             three cards — see PanelCards
 * ```
 *
 * The header is the same three parts in a different measure, which is why it
 * is one element with three width sets rather than three headers — see
 * `HEADER_SHAPE`.
 *
 * ## `layout: track` — Home's "How we work" (`2846:5480`), #309
 *
 * What the numbered rail became. The three engagements are no longer a
 * vertical stack beside a sticky rail; they are a horizontal snap-scroller of
 * hairline-separated columns, with the rail's job — where am I in the set —
 * done by an ink third of the rule above them. See `PanelTrack`.
 */
export function RailPanelsSection({
  heading,
  intro,
  layout,
  rail,
  panels,
  surface,
  backgroundMedia,
  loc,
  panelCards: Cards = PanelCards,
}: RailPanelsSectionProps) {
  const items = panels ?? []
  const resolved = resolveSurface(surface, 'railPanelsSection')
  // `null` on every band that carries no picture, which is the shell's own
  // "there is nothing behind this band" — so all four layouts pass it
  // unconditionally rather than branching.
  const background = sectionBackground(backgroundMedia, resolved)
  const chosenLayout = stegaClean(layout)
  const isCards = chosenLayout === 'cards'
  const isRows = chosenLayout === 'rows'
  const isGrid = chosenLayout === 'grid'
  const isTrack = chosenLayout === 'track'
  const mode = stegaClean(rail) === 'number' ? 'number' : 'label'
  // Panel `_key`s are unique within the document, so they identify a panel
  // across both halves of the band without the section needing its own id
  // (SectionProps strips `_key` from the section itself).
  const panelId = (key: string | undefined, index: number) => `rail-panel-${key ?? index}`

  const isRail = !isCards && !isRows && !isGrid && !isTrack
  const shape = isCards ? 'wide' : isTrack ? 'split' : isRail ? 'spread' : 'measured'

  const header = (
    <div
      // The band's header surface (#107). There is no `header` object in the
      // schema — the three parts are flat fields — so the wrapper resolves to
      // `heading`, the one that is always the subject when an editor reaches
      // for this region.
      data-sanity={fieldAttr(loc, 'heading')}
      className={cn('flex w-full flex-col', HEADER_SHAPE[shape].wrapper)}
    >
      {heading ? (
        <h2 className={cn('font-display text-balance', HEADER_SHAPE[shape].heading)}>{heading}</h2>
      ) : null}
      {intro ? <p className={HEADER_SHAPE[shape].intro}>{intro}</p> : null}
    </div>
  )

  if (isTrack) {
    return (
      // `2846:5480` — 128 above and below. The rule the track hangs from sits
      // 18 under the header row, which is `PanelTrack`'s own top edge.
      <SectionShell surface={resolved} top="md" bottom="md" background={background}>
        <div className="flex flex-col gap-[18px]">
          {header}
          <PanelTrack
            label={stegaClean(heading) ?? undefined}
            items={items.map((panel, index) => ({
              key: panel._key ?? String(index),
              heading: panel.heading ?? panel.railLabel,
              body: panel.body,
              note: panel.note,
              dataSanity: itemAttr(loc, 'panels', panel._key),
            }))}
          />
        </div>
      </SectionShell>
    )
  }

  if (isRows) {
    return (
      // `2749:6863` — 128px above, 64px below, and the header is the heading
      // alone: the frame writes no standfirst over the services. `intro` still
      // renders if a band carries one, in the rail header's measure.
      <SectionShell surface={resolved} top="md" bottom="sm" background={background}>
        <div className="flex flex-col gap-10 lg:gap-16">
          {header}
          <PanelRows
            items={items.map((panel, index) => ({
              key: panel._key ?? String(index),
              heading: panel.heading ?? panel.railLabel,
              note: panel.note,
              body: panel.body,
              details: panel.details,
              dataSanity: itemAttr(loc, 'panels', panel._key),
            }))}
          />
        </div>
      </SectionShell>
    )
  }

  if (isGrid) {
    return (
      // `2358:2788` — 128px above and below, 48px between the heading and the
      // columns. The header is the heading alone on the frame; `intro` still
      // renders if a band carries one, in the rows header's measure.
      <SectionShell surface={resolved} top="md" bottom="md" background={background}>
        <div className="flex flex-col gap-10 lg:gap-12">
          {header}
          <PanelGrid
            onInk={resolved === 'ink'}
            items={items.map((panel, index) => ({
              key: panel._key ?? String(index),
              heading: panel.heading ?? panel.railLabel,
              mark: panel.mark,
              details: panel.details,
              dataSanity: itemAttr(loc, 'panels', panel._key),
            }))}
          />
        </div>
      </SectionShell>
    )
  }

  if (isCards) {
    return (
      <SectionShell surface={resolved} top="md" bottom="md" background={background}>
        <div className="flex flex-col gap-10 lg:gap-[65px]">
          {header}
          <Cards
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
    // `2747:4486` — 128 above and below, and 128 between the header and the
    // band, at both widths.
    <SectionShell surface={resolved} top="md" bottom="md" background={background}>
      <div className="flex flex-col gap-32">
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
          {mode === 'label'
            ? items.map((panel, index) => (
                <PanelPlate
                  key={panel._key}
                  id={panelId(panel._key, index)}
                  logo={panel.logo}
                  heading={panel.heading}
                  body={panel.body}
                  note={panel.note}
                  button={panel.button}
                  media={panel.media}
                  dataSanity={itemAttr(loc, 'panels', panel._key)}
                />
              ))
            : items.map((panel, index) => (
                <article
                  key={panel._key}
                  id={panelId(panel._key, index)}
                  // The panel's own path — `sections[_key=="…"].panels[_key=="…"]`.
                  // `panels` has exactly one member type, so it serialises as
                  // an `arrayItem` and resolves natively at this depth (#104).
                  data-sanity={itemAttr(loc, 'panels', panel._key)}
                  // At 402 a numbered panel is one compact ink ROW —
                  // `ContentPlatform - Mobile` `1814:1714`: the numeral left,
                  // the title stacked over its note. At `lg` it becomes the
                  // full panel, a 500px copy column beside a 395px media
                  // square, with the numbering handed back to `PanelRail`.
                  className="bg-ink flex items-center gap-3 py-4 pl-4 pr-8 text-white lg:flex-row lg:items-center lg:gap-[33px] lg:bg-transparent lg:p-0 lg:text-inherit"
                >
                  {/*
                   * The rail numeral, inlined. `PanelRail` is the 1440
                   * treatment — a sticky 82px column beside the stack — and it
                   * has nowhere to stand at 402, so the mobile row carries its
                   * own 68 × 48 numeral box (`1814:1930`).
                   */}
                  <span
                    aria-hidden="true"
                    className="flex h-12 w-[68px] shrink-0 items-center justify-center text-[36px] leading-none tracking-[-0.0262em] lg:hidden"
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className="flex min-w-0 flex-1 flex-col lg:flex lg:w-[500px] lg:flex-col lg:gap-12">
                    {panel.heading ? (
                      // 18/24 Medium in the row (`1814:1719`), the 48px
                      // section step in the panel. `max-lg:` rather than a
                      // `lg:` pair so the desktop step keeps the token's own
                      // line-height.
                      <h3 className="text-display-xl font-display text-balance max-lg:text-[18px] max-lg:font-medium max-lg:leading-6">
                        {panel.heading}
                      </h3>
                    ) : null}

                    {/* The row carries no prose — the frame drops it at 402
                        and keeps the note as the one-line gloss. */}
                    {panel.body ? (
                      <p className="text-lead hidden leading-[1.2] lg:block">{panel.body}</p>
                    ) : null}
                    {panel.note ? (
                      // 14/24 Medium `#D3D3D3` in the ink row (`1814:1721`).
                      <p className="text-lead text-fg-muted max-lg:text-on-ink-muted leading-[1.2] max-lg:text-[14px] max-lg:font-medium max-lg:leading-6">
                        {panel.note}
                      </p>
                    ) : null}

                    {/* No button on the row at 402 (`1814:1714`). */}
                    {panel.button ? (
                      <div className="hidden lg:block">
                        <ButtonLink button={panel.button} />
                      </div>
                    ) : null}
                  </div>

                  {panel.media ? (
                    <SanityImage
                      source={panel.media.image}
                      alt={panel.media.alt}
                      ratio="1/1"
                      width={790}
                      // One value, because the square has one width: a
                      // viewport-relative fallback could only describe the
                      // widths where it is `display: none`.
                      sizes="395px"
                      // A 1440 element: the 402 row has no room for a square,
                      // and a full-width photo between every row would bury
                      // the stack.
                      className="hidden lg:block lg:h-[396px] lg:w-[395px] lg:shrink-0"
                    />
                  ) : (
                    // The frame's media slot is a flat rectangle on the panels
                    // whose image is not chosen yet; holding the space stops
                    // the row collapsing onto the copy column.
                    <div className="bg-bone hidden lg:block lg:h-[396px] lg:w-[395px] lg:shrink-0" />
                  )}
                </article>
              ))}
        </PanelBand>
      </div>
    </SectionShell>
  )
}
