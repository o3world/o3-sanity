import { DisplayHeading, Eyebrow, OrbitalDiagram, SectionShell } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { stegaClean } from '@sanity/client/stega'

import { Mark, markProps } from '../../base/mark/Mark'
import { DECORATED_BAND_CLASS } from '../../decoration'
import { MoleculeDecoration } from '../../MoleculeDecoration'
import { isDarkSurface, resolveSurface } from '../../surface'

type FeatureGridSectionProps = SectionProps<'featureGridSection'>

/**
 * Parallel claims in the current Partner and Engineering compositions:
 * 66px glyph columns (2354:2532), illustration cards (4116:50601), and plain
 * two-column use-case rows (4043:49741 / 4039:49503). The existing grid and
 * orbital layouts remain available to authored sections using those values.
 */
export function FeatureGridSection({
  eyebrow,
  heading,
  subheading,
  layout,
  features,
  decoration,
  surface,
}: FeatureGridSectionProps) {
  const items = features ?? []
  const chosen = stegaClean(layout)
  const orbital = chosen === 'orbital'
  const cards = chosen === 'cards'
  const resolved = resolveSurface(surface, 'featureGridSection')
  const onInk = isDarkSurface(resolved)

  /**
   * A feature sits under the band's own heading, so it is normally an `h3`.
   * When the band carries **no** heading there is no `h2` above it, and an
   * `h3` straight after the page's `h1` is a skipped level.
   *
   * That is not hypothetical: the Solutions frame (`1925:6138`) draws this
   * band with no heading at all, so `/solutions` shipped an invalid heading
   * order — visible only below `lg`, because the `orbital` composition renders
   * its labels as `<p>` and the grid fallback is what carries the headings.
   * Found by the `Pages/Solutions` mobile mockup, which is the first thing to
   * render the whole page and axe-scan it.
   */
  const featureTag = heading ? 'h3' : 'h2'

  /** The disc's ink. On ink, white is the only honest inversion. */
  const markTone = onInk && !cards ? 'text-white' : 'text-ink'

  /** WHAT STANDS BESIDE THE COPY — the dotted mark. */
  const beside = (feature: (typeof items)[number], className: string) => (
    <Mark
      {...markProps(feature.mark)}
      onInk={onInk && !cards}
      className={`${markTone} ${className}`}
    />
  )

  const grid = (
    <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
      {items.map((feature) => (
        <div key={feature._key} className="flex items-center gap-8 py-8 lg:px-8 lg:py-12">
          {/* 138px on the frame. A disc here draws at the ink the frame
                  uses (#0A0A0A — `text-ink`, not the band's #232323 body
                  colour). */}
          {beside(feature, 'lg:w-34.5 w-20')}
          <div className="flex flex-col justify-center gap-2">
            {feature.heading ? (
              <DisplayHeading as={featureTag} level="lg" className="tracking-[-0.0222em]">
                {feature.heading}
              </DisplayHeading>
            ) : null}
            {feature.body ? (
              <p className="text-lead leading-[1.2] tracking-normal">{feature.body}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )

  // Current partner columns and illustration cards.
  const stack = (
    <div
      className={
        cards
          ? 'grid gap-8 md:grid-cols-2 lg:grid-cols-3'
          : 'grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3'
      }
    >
      {items.map((feature) => (
        <div
          key={feature._key}
          className={
            cards
              ? 'text-ink flex min-h-[296px] flex-col gap-4 rounded-2xl bg-white px-8 py-4 shadow-[0_24px_32px_0_rgb(0_0_0/0.2)]'
              : 'flex flex-col gap-6'
          }
        >
          {cards ? (
            <div className="flex h-[180px] items-center justify-center">
              {beside(
                feature,
                stegaClean(feature.mark?.kind) === 'image' ? 'h-full w-full' : 'w-[138px]',
              )}
            </div>
          ) : (
            beside(feature, 'h-[66px] w-[66px]')
          )}
          {feature.heading ? (
            <DisplayHeading
              as={featureTag}
              level="md"
              className={
                cards
                  ? 'font-sans text-[24px] leading-[34px] tracking-normal'
                  : 'text-balance font-sans text-[28px] leading-[38px] tracking-normal'
              }
            >
              {feature.heading}
            </DisplayHeading>
          ) : null}
          {feature.body ? (
            <p
              className={`text-[20px] leading-7 ${onInk && !cards ? 'text-white/65' : cards ? 'text-ink/65' : 'text-fg-muted'}`}
            >
              {feature.body}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )

  // Current use-case lists have no graphic slot.
  const rows = (
    <ul className="divide-line flex flex-col divide-y">
      {items.map((feature) => (
        <li
          key={feature._key}
          className="flex flex-col gap-6 py-8 first:pt-0 last:pb-0 lg:flex-row lg:items-start lg:gap-[139px] lg:py-12"
        >
          <div className="min-w-0 lg:w-[609px] lg:shrink-0">
            {feature.heading ? (
              <DisplayHeading
                as={featureTag}
                level="lg"
                className="max-w-[499px] font-sans text-[28px] leading-[38px] tracking-normal"
              >
                {feature.heading}
              </DisplayHeading>
            ) : null}
          </div>
          {feature.body ? (
            <p
              className={`text-[20px] leading-7 lg:w-[500px] ${onInk && !cards ? 'text-white/65' : cards ? 'text-ink/65' : 'text-fg-muted'}`}
            >
              {feature.body}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  )

  const composition = chosen === 'stack' || cards ? stack : chosen === 'rows' ? rows : grid

  return (
    <SectionShell
      surface={resolved}
      top="md"
      bottom="md"
      width={orbital ? 'full' : 'section'}
      className={DECORATED_BAND_CLASS}
    >
      <MoleculeDecoration decoration={decoration} block="featureGridSection" surface={resolved} />

      <div
        className={
          chosen === 'rows'
            ? 'flex flex-col gap-16 lg:gap-32'
            : cards
              ? 'flex flex-col gap-12'
              : 'flex flex-col gap-16'
        }
      >
        {eyebrow || heading || subheading ? (
          <header className="flex max-w-[822px] flex-col gap-2">
            {eyebrow ? (
              <Eyebrow size="lg" tone="brand" className="pb-4">
                {eyebrow}
              </Eyebrow>
            ) : null}
            {heading ? <DisplayHeading level="hero">{heading}</DisplayHeading> : null}
            {subheading ? <p className="text-lead text-fg-body">{subheading}</p> : null}
          </header>
        ) : null}

        {orbital ? (
          <>
            <div className="lg:hidden">{grid}</div>
            <div className="hidden lg:block">
              <OrbitalDiagram
                items={items.map((feature) => ({
                  heading: feature.heading ?? '',
                  body: feature.body,
                }))}
              />
            </div>
          </>
        ) : (
          composition
        )}
      </div>
    </SectionShell>
  )
}
