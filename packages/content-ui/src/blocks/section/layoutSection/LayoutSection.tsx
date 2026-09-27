import type { ComponentType } from 'react'
import { cn } from '@o3/ui/lib/utils'

import { DisplayHeading, Eyebrow, RevealSequence, SectionShell } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { stegaClean } from '@sanity/client/stega'

import { BASE_BLOCK_COMPONENTS } from '../../base/baseComponents'
import { ARTICLE_COLUMN, LAYOUT_BLEED_COLUMN, LAYOUT_COLUMN } from '../../../imageSizes'
import { DECORATED_BAND_CLASS, resolveDecoration } from '../../decoration'
import { MoleculeDecoration } from '../../MoleculeDecoration'
import { resolveSurface } from '../../surface'

type LayoutSectionProps = SectionProps<'layoutSection'> & { sequence?: boolean }

const COLUMN_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
}

/**
 * The bleeding band's grid (`2360:2861`): a 395 copy column and everything
 * else, 31px apart. It switches at `lg` rather than `md`, because the bleeding
 * column is a landscape window and a 768 viewport has no width left to draw
 * one in once 395 is spent — below that the band stacks and the picture is an
 * ordinary figure.
 *
 * The count knob is ignored while this is on: the frame draws two columns and
 * the second one is the bleed.
 */
const BLEED_COLUMN_CLASS = 'grid-cols-1 lg:grid-cols-[minmax(0,395px)_1fr]'

/**
 * THE COLUMN THAT RUNS OFF THE SCREEN.
 *
 * The frame's picture box is 1392 wide and its own frame is 1440, so 474px of
 * it is off-canvas: what is actually drawn is a 918 × 575 window on the photo.
 * That window is the aspect here, and the figure inside is stretched to fill it
 * — a bleeding column crops its media rather than sizing to it, which is why
 * the knob's description says to give it a figure.
 *
 * The margin is the distance from the container's right edge to the viewport's,
 * negated, and it is written as a `min()` of two terms rather than the tidier
 * `calc(50% - 50vw)`: a percentage margin resolves against the grid AREA, not
 * the container, so the tidy version overshoots by however wide the copy column
 * is. Below the 1440 cap the container is the viewport less two gutters, so the
 * gutter is the whole distance; above it the container stops and the named
 * half-stage token supplies the centred edge. `min()` of two negatives takes
 * the larger distance, which is whichever of the two is in force.
 */
const BLEED_MEDIA_CLASS =
  'lg:mr-[min(calc(-1*var(--spacing-gutter)),calc(var(--container-section-half)-50vw))] ' +
  'lg:aspect-[918/575] lg:overflow-hidden ' +
  'lg:[&_figure]:h-full lg:[&_img]:h-full lg:[&_img]:rounded-none lg:[&_img]:object-cover'

function resolveColumns(value: number | null | undefined): 1 | 2 | 3 {
  const clean = typeof value === 'number' ? value : Number(stegaClean(String(value ?? '')))
  return clean === 2 || clean === 3 ? clean : 1
}

/**
 * The one true two-tier block (ADR 0001): 1–3 columns of base-tier blocks.
 * Items dispatch through the base roster directly — the base tier never
 * contains sections, so the full registry isn't needed here.
 */
export function LayoutSection({
  variant,
  eyebrow,
  heading,
  headingLevel,
  subheading,
  columns,
  bleed,
  decoration,
  items,
  surface,
  width,
  sequence = false,
}: LayoutSectionProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const components: Record<string, ComponentType<any>> = BASE_BLOCK_COMPONENTS
  const composition = stegaClean(variant)
  const prose = composition === 'prose'
  const overview = composition === 'overview'
  const brand = composition === 'brand'
  const current = prose || overview || brand
  const bleeding = overview || stegaClean(bleed) === 'end'
  const selectedHeadingLevel = stegaClean(headingLevel)
  const explicitHeadingLevel = selectedHeadingLevel === 'xl' || selectedHeadingLevel === 'lg'
  const resolvedHeadingLevel = current
    ? 'hero'
    : explicitHeadingLevel
      ? selectedHeadingLevel
      : bleeding
        ? 'lg'
        : 'xl'
  const showMolecule = resolveDecoration(decoration, 'layoutSection') === 'molecule'
  const columnCount = resolveColumns(columns)
  const columnClass = overview
    ? 'grid-cols-1 lg:grid-cols-[minmax(0,501px)_minmax(0,1fr)]'
    : bleeding
      ? BLEED_COLUMN_CLASS
      : COLUMN_CLASSES[columnCount]
  const entries = items ?? []
  const slotSizes =
    current && columnCount > 1
      ? columnCount === 2
        ? '(min-width: 1920px) 848px, (min-width: 1440px) calc(50vw - 112px), (min-width: 768px) calc(42.29287vw - 1.01734px), (min-width: 402px) calc(84.58574vw + 29.96532px), calc(100vw - 32px)'
        : '(min-width: 1920px) 555px, (min-width: 1440px) calc(33.333333vw - 85.333333px), (min-width: 768px) calc(28.195247vw - 11.344893px), (min-width: 402px) calc(84.58574vw + 29.96532px), calc(100vw - 32px)'
      : stegaClean(width) === 'article'
        ? ARTICLE_COLUMN
        : LAYOUT_COLUMN[columnCount]
  /*
   * WHERE THE HEADER SITS is what the bleed changes about the band, and not
   * only where the picture ends. `2360:2861` gives the copy column the heading
   * at `Heading/h3` and gives the rest of the row to the photo, so there is no
   * full-width header strip to draw one in — the band's header IS the first
   * column's first line.
   */
  const Content = sequence ? RevealSequence : 'div'
  const header =
    eyebrow || heading || subheading ? (
      <header
        data-reveal-step={sequence ? 'heading' : undefined}
        className={cn('flex flex-col', current ? 'max-w-[822px] gap-2' : 'gap-6')}
      >
        {eyebrow ? (
          <Eyebrow size="lg" tone="brand" className={current ? 'pb-4' : undefined}>
            {eyebrow}
          </Eyebrow>
        ) : null}
        {heading ? (
          <DisplayHeading
            level={resolvedHeadingLevel}
            // The redesigned Overview and molecule treatments use Light;
            // generic layouts retain their unbound Regular heading (#350).
            className={explicitHeadingLevel || bleeding || showMolecule ? undefined : 'font-normal'}
          >
            {heading}
          </DisplayHeading>
        ) : null}
        {subheading ? (
          <p
            className={
              current
                ? 'text-lead text-fg-body'
                : 'text-display-lg font-display text-fg-muted text-balance'
            }
          >
            {subheading}
          </p>
        ) : null}
      </header>
    ) : null
  /**
   * One item, dispatched through the base roster. `slotSizes` is the column's
   * own `sizes` (#268): the count is this section's field, so a base block has
   * no way to work its own slot out, and the rest ignore the prop.
   */
  const renderItem = (item: (typeof entries)[number], slotSizes: string) => {
    const Component = Object.prototype.hasOwnProperty.call(components, item._type)
      ? components[item._type]
      : undefined
    if (!Component) return null
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _type, ...props } = item
    const content = (
      <Component
        key={item._key}
        {...props}
        slotSizes={slotSizes}
        {...(item._type === 'richText' && (prose || overview)
          ? {
              bodyClassName: cn(
                'max-w-[822px] text-lead text-fg-body',
                overview && 'lg:text-[28px] lg:leading-[38px]',
              ),
            }
          : {})}
      />
    )
    return sequence ? (
      <div
        key={item._key}
        data-reveal-step="content"
        className={bleeding && item === entries.at(-1) ? 'h-full' : undefined}
      >
        {content}
      </div>
    ) : (
      content
    )
  }
  const resolved = resolveSurface(surface, 'layoutSection')
  // The band's measure (`2960:6885`). `stegaClean` for the same reason
  // `resolveDecoration` does it: a draft-mode string fails a bare `===`.
  const measure = stegaClean(width) === 'article' ? 'article' : 'section'
  return (
    <SectionShell
      surface={resolved}
      width={measure}
      top="md"
      bottom="md"
      // Only when decorated, or when a column bleeds — the clip is what keeps a
      // column that ends on the viewport's edge from pushing the page sideways
      // over the scrollbar. A layout column otherwise holds arbitrary base
      // blocks, and an unconditional clip cuts the edge off any that overruns
      // the band — `/1682-conference-ai-innovation`'s CTA button is 13px wider
      // than a 390px viewport (#181) and loses the end of its label.
      className={cn(
        (showMolecule || bleeding) && DECORATED_BAND_CLASS,
        current && 'max-lg:pb-16',
        (prose || overview) && 'max-lg:pt-16',
        brand &&
          '[--media-card-height:370px] [--media-card-radius:32px] [--media-card-shadow:0_24px_32px_0_rgb(0_0_0/0.2)] max-lg:[--media-card-aspect:1] max-lg:[--media-card-height:auto] lg:[--media-card-height:396px]',
      )}
    >
      <MoleculeDecoration decoration={decoration} block="layoutSection" surface={resolved} />
      <Content
        {...(sequence ? { boundaries: 'items' as const } : {})}
        className={cn(
          'flex flex-col',
          current ? (prose && columnCount === 1 ? 'gap-2' : 'gap-16') : 'gap-12',
        )}
      >
        {/*
         * The three-part band header the interior frames use everywhere
         * (`1924:5344`): a brand-red eyebrow, the 48px heading 24px under it
         * (`2358:2761`), and a set-back second line at the same size. The subheading is `text-fg-muted`
         * rather than a smaller step — the frame keeps it at 36px and drops
         * the value, which is what makes it read as a continuation of the
         * heading rather than a standfirst.
         *
         * A bleeding band draws the same header inside its first column
         * instead; see `header` above.
         */}
        {bleeding ? null : header}
        {/*
         * NO `itemAttr` HERE, AND IT IS NOT AN OMISSION (ADR 0022). Every other
         * block with a keyed array attributes its items so the canvas toolbar
         * can dock to one — `railPanelsSection.panels`,
         * `screenGridSection.screens`. This one cannot: `items` is the repo's
         * only polymorphic array below a block root, and at `sanity@6.8.0` /
         * `@sanity/visual-editing@5.7.3` the overlay resolves nothing inside it
         * (#104, #115). The failure is silent — the resolver context comes back
         * undefined and our component resolver is never called, with no error
         * and no console warning — so an attribute added here would look
         * correct, test correct, and do nothing on the canvas.
         *
         * `docs/upstream/` has both bugs written up. When they are fixed, this
         * loop takes `itemAttr(loc, 'items', item._key)` and `loc` comes back
         * into the destructure above.
         */}
        <div
          className={cn(
            'grid items-start',
            overview ? 'gap-8 lg:gap-[139px]' : current || bleeding ? 'gap-8' : 'gap-10',
            columnClass,
          )}
        >
          {bleeding ? (
            <>
              {/* Everything but the last item is the copy column, under the
                  header the band did not draw above it. */}
              <div className={overview ? 'flex flex-col gap-2' : 'flex flex-col gap-6'}>
                {header}
                {/* 395 in the frame; the three-up column's 389 is the value
                    already written down for that width. */}
                {entries.slice(0, -1).map((item) => renderItem(item, LAYOUT_COLUMN[3]))}
              </div>
              <div
                className={
                  overview
                    ? 'rounded-[32px] shadow-[-32px_32px_64px_rgba(0,0,0,0.2)] lg:mr-[min(calc(-1*var(--spacing-gutter)),calc(var(--container-section-half)-50vw))] lg:h-[502px] lg:[&_figure]:h-full [&_img]:rounded-[32px] lg:[&_img]:h-full lg:[&_img]:object-cover'
                    : BLEED_MEDIA_CLASS
                }
              >
                {entries
                  .slice(-1)
                  .map((item) =>
                    renderItem(
                      item,
                      overview
                        ? '(min-width: 1920px) calc(50vw + 224px), (min-width: 1440px) calc(100vw - 736px), (min-width: 1024px) calc(92.29287vw - 625.01734px), (min-width: 402px) calc(84.58574vw + 29.96532px), calc(100vw - 32px)'
                        : LAYOUT_BLEED_COLUMN,
                    ),
                  )}
              </div>
            </>
          ) : (
            entries.map((item) => renderItem(item, slotSizes))
          )}
        </div>
      </Content>
    </SectionShell>
  )
}
