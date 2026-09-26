import { Eyebrow, SectionShell } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { fieldAttr, itemAttr } from '@o3/content-runtime/data-attribute'
import { stegaClean } from '@sanity/client/stega'

import { ButtonLink } from '../../../ButtonLink'
import { SanityImage } from '../../../SanityImage'
import { sectionBackground } from '../../sectionBackground'
import { resolveSurface } from '../../surface'

import { PanelBand } from './PanelBand'
import { PanelCards } from './PanelCards'
import { PanelPlate } from './PanelPlate'
import { MoleculeDecoration } from '../../MoleculeDecoration'
import { DECORATED_BAND_CLASS } from '../../decoration'
import { PanelRows } from './PanelRows'
import { PanelTrack } from './PanelTrack'
import { PLATE_BLEED_CLASS, PLATE_BLEED_SIZES } from './plateBleed'

/** Current stacked lockups: Home 3720:62626, Solutions 4018:37996,
 * Engineering 4039:49385. The track retains its separate composition. */
const HEADER_SHAPE = {
  spread: {
    wrapper: 'max-w-[821px] gap-2',
    heading: 'text-hero',
    intro: 'text-lead text-fg-body',
  },
  measured: {
    wrapper: 'max-w-[1035px] gap-2',
    heading: 'text-hero',
    intro: 'text-lead text-fg-body',
  },
  wide: {
    wrapper: 'max-w-[821px] gap-2',
    heading: 'text-hero',
    intro: 'text-lead text-fg-body',
  },
  split: {
    // About values: 3771:80605 desktop, 3883:16533 mobile.
    wrapper: 'max-w-[608px] gap-2',
    heading: 'text-hero',
    intro: 'text-lead text-fg-body',
  },
} as const

type RailPanelsSectionProps = SectionProps<'railPanelsSection'>

/** Parallel offers arranged as rails, service rows, columns, or a scrolling track. */
export function RailPanelsSection({
  eyebrow,
  heading,
  intro,
  layout,
  headerWidth,
  rail,
  plate,
  panels,
  surface,
  backgroundMedia,
  decoration,
  loc,
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
  const bleeding = stegaClean(plate) === 'bleed'
  // Panel ids are namespaced by the section's own `_key`, read out of `loc`
  // (SectionProps strips `_key` from the section itself). Panel keys alone are
  // NOT unique on a page: duplicating a rail band in the Studio copies its
  // panels' keys verbatim, and with two bands minting the same DOM ids every
  // `getElementById` — both rails' observers and every anchor link — resolves
  // to the first band and cross-wires the second.
  const sectionKey = loc?.path.match(/_key=="([A-Za-z0-9_-]+)"/)?.[1]
  const panelId = (key: string | undefined, index: number) =>
    `rail-panel-${sectionKey ? `${sectionKey}-` : ''}${key ?? index}`

  const isRail = !isCards && !isRows && !isGrid && !isTrack
  const shape =
    isRows && stegaClean(headerWidth) === 'wide'
      ? 'measured'
      : isCards || isRows
        ? 'wide'
        : isTrack
          ? 'split'
          : isRail
            ? 'spread'
            : 'measured'

  const header = (
    <div
      // The band's header surface (#107). There is no `header` object in the
      // schema — the three parts are flat fields — so the wrapper resolves to
      // `heading`, the one that is always the subject when an editor reaches
      // for this region.
      data-sanity={fieldAttr(loc, 'heading')}
      className={cn('flex w-full flex-col', HEADER_SHAPE[shape].wrapper)}
    >
      {eyebrow ? (
        <Eyebrow size="lg" className="pb-4">
          {eyebrow}
        </Eyebrow>
      ) : null}
      {heading ? (
        <h2 className={cn('font-display text-balance', HEADER_SHAPE[shape].heading)}>{heading}</h2>
      ) : null}
      {intro ? <p className={HEADER_SHAPE[shape].intro}>{intro}</p> : null}
    </div>
  )

  if (isTrack) {
    return (
      // 128 above and below at 1440 (`2846:5481`), 48 at 402 (`2975:8356`) —
      // the one band on this page whose vertical rhythm steps down. The rule
      // the track hangs from sits 18 under the header row, which is
      // `PanelTrack`'s own top edge.
      <SectionShell
        surface={resolved}
        top="md"
        bottom="md"
        background={background}
        // Same property as the shell's own step, so the variant wins the
        // cascade rather than racing a `py-*` shorthand against it.
        className="max-lg:pb-12 max-lg:pt-12"
      >
        <PanelTrack
          // The header renders inside the track so the rule it hangs from
          // keeps its 18px seat under the header row.
          header={header}
          label={stegaClean(heading) ?? undefined}
          items={items.map((panel, index) => ({
            key: panel._key ?? String(index),
            heading: panel.heading ?? panel.railLabel,
            body: panel.body,
            note: panel.note,
            dataSanity: itemAttr(loc, 'panels', panel._key),
          }))}
        />
      </SectionShell>
    )
  }

  if (isRows || isGrid) {
    return (
      <SectionShell surface={resolved} top="md" bottom="md" background={background}>
        <div className="flex flex-col gap-16 lg:gap-32">
          {header}
          <PanelRows
            onInk={resolved === 'ink'}
            lastDetailIsOutcome={isRows}
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

  if (isCards) {
    return (
      <SectionShell
        surface={resolved}
        top="md"
        bottom="md"
        background={background}
        className={DECORATED_BAND_CLASS}
      >
        <MoleculeDecoration decoration={decoration} block="railPanelsSection" surface={resolved} />
        <div className="flex flex-col gap-16">
          {header}
          <PanelCards
            onInk={resolved === 'ink'}
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
    // Current technology band: 64px rhythm / 24px gutters on mobile (2975:8188).
    <SectionShell
      surface={resolved}
      top="md"
      bottom="md"
      background={background}
      // Clip the bleeding artwork without creating a scroll container that
      // prevents the rail from sticking to the viewport.
      className={cn(
        mode === 'label' && 'max-lg:px-6 max-lg:pb-16 max-lg:pt-16',
        bleeding && 'relative isolate overflow-clip',
      )}
    >
      <div className={cn('flex flex-col', mode === 'label' ? 'gap-16 lg:gap-32' : 'gap-32')}>
        {header}

        <PanelBand
          mode={mode}
          panelIds={items.map((panel, index) => panelId(panel._key, index))}
          railItems={items.map((panel, index) => ({
            key: panel._key ?? String(index),
            panelId: panelId(panel._key, index),
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
                  railLabel={panel.railLabel}
                  body={panel.body}
                  note={panel.note}
                  button={panel.button}
                  media={panel.media}
                  plate={bleeding ? 'bleed' : 'square'}
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
                  className="bg-ink flex items-center gap-3 py-4 pl-4 pr-8 text-white lg:gap-[33px] lg:bg-transparent lg:p-0 lg:text-inherit"
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

                  <div className="flex min-w-0 flex-1 flex-col lg:w-[500px] lg:gap-12">
                    {/* A wordmark wins the heading's slot here too — the knob
                        is what picks the rail, and either rail can be turned
                        on a band whose panels lead with a logo. */}
                    {panel.logo ? (
                      <SanityImage
                        source={panel.logo}
                        alt={panel.heading ?? panel.railLabel ?? ''}
                        width={640}
                        className="h-12 w-auto min-w-0 max-w-[177px] shrink object-contain object-left lg:h-[70px] lg:max-w-[257px] lg:shrink-0"
                        sizes="(min-width: 1024px) 257px, 177px"
                      />
                    ) : panel.heading ? (
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

                  {panel.media && bleeding ? (
                    // The 402 row still has no room for it — the bleed is a
                    // 1440 treatment here too.
                    <div className={cn('hidden lg:block', PLATE_BLEED_CLASS)}>
                      <SanityImage
                        source={panel.media.image}
                        alt={panel.media.alt}
                        ratio="fill"
                        width={1600}
                        sizes={PLATE_BLEED_SIZES}
                      />
                    </div>
                  ) : panel.media ? (
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
