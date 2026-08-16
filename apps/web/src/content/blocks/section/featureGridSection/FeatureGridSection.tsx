import { DisplayHeading, OrbitalDiagram, SectionShell } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { Mark, markProps } from '@/content/blocks/base/mark/Mark'
import { DECORATED_BAND_CLASS } from '@/content/blocks/decoration'
import { MoleculeDecoration } from '@/content/blocks/MoleculeDecoration'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type FeatureGridSectionProps = SectionProps<'featureGridSection'>

/**
 * Section block: a set of parallel short claims, in the four compositions the
 * canonical frames draw them in — #56, surfaced by #46 and #47, extended by
 * #92.
 *
 * Every layout renders the same three fields — a `mark`, a `heading`, an
 * optional `body`. What changes is how they are set against each other.
 *
 * **`grid` — About `1925:5915`.** Mark and copy paired, two across.
 *
 * ```
 * 128px 0, gap 65
 *   header  padding-left 96      48px heading, flush left
 *   body    padding 0 96         two rows, space-between
 *     cell  48px 32px, gap 32    disc 138 | name 36px / body 24px in 560
 * ```
 *
 * **`stack` — "Why Sanity + O3" `2354:2530`, "What it enables." `2334:2122`.**
 * Mark above the copy, three across. The two bands are the same composition at
 * two densities: the first sets a 37px disc over a 28px lead and a 20px
 * paragraph in 288px columns; the second sets a 59px disc over a 28px line and
 * no body at all, wrapping five features onto two rows. That is why `body` is
 * optional on the member — a whole canonical band omits it.
 *
 * **`rows` — "Use cases." `2341:2250`.** One hairlined full-width row per
 * feature: a 75px disc and the heading left in 609, the body right in 500,
 * 48px of padding above and below, a 1px `#76746F` rule under each.
 *
 * **`orbital` — Solutions `1928:6524`.** Exactly four features on a
 * 1120×1172 dotted tetrahedron. See `OrbitalDiagram` for why that is a new
 * drawing rather than `OrbitalSphere` plus labels.
 *
 * **One block, one `layout` field, not four blocks.** The bands carry
 * identical content and differ only in arrangement, which is the same test
 * `railPanelsSection`'s `rail` field passed. Four block types would have made
 * "add a feature" a question about which page you were on — and it is what
 * renamed this block: as `disciplineGridSection` it told an editor adding
 * "Multi-channel publishing from one source" that they were authoring a
 * discipline.
 *
 * **The mark is per feature** (`Mark`): the animated orb by default, the
 * frame's halftone disc when a feature asks for it, so a band can mix them.
 * The `orbital` composition is the exception — the diagram draws its own nodes
 * into one canvas and has no slot to swap.
 *
 * The orbital composition is `lg` and up. 1120px of absolutely-positioned copy
 * has no honest 402 form and no 402 frame to copy, so below `lg` it falls back
 * to the grid — which is the same content in a shape that does work there
 * (ADR 0006).
 */
export function FeatureGridSection({
  heading,
  layout,
  features,
  decoration,
  surface,
}: FeatureGridSectionProps) {
  const items = features ?? []
  const chosen = stegaClean(layout)
  const orbital = chosen === 'orbital'
  const resolved = resolveSurface(surface, 'white')
  const onInk = resolved === 'ink'

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
  const markTone = onInk ? 'text-white' : 'text-ink'

  const grid = (
    <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
      {items.map((feature) => (
        <div key={feature._key} className="flex items-center gap-8 py-8 lg:px-8 lg:py-12">
          {/* 138px on the frame. A disc here draws at the ink the frame
                  uses (#0A0A0A — `text-ink`, not the band's #232323 body
                  colour). */}
          <Mark
            {...markProps(feature.mark)}
            onInk={onInk}
            className={`${markTone} lg:w-34.5 w-20`}
          />
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

  /*
   * `2354:2532` sets three 288px columns 32px apart on a 1248 content column,
   * which is a fixed row rather than a grid — but `2334:2115` is a declared
   * `repeat(3, minmax(0,1fr))` holding five cells, so the grid is what both
   * bands are. 24px gap is the second frame's; the first's 32 is the same
   * rhythm at a narrower measure.
   *
   * The mark's box is the one thing that differs between them (37 against 59),
   * and it follows the body: a feature with a paragraph under it gets the
   * smaller disc, because that is what the denser band draws.
   */
  const stack = (
    <div className="grid gap-x-6 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
      {items.map((feature) => (
        <div key={feature._key} className="flex flex-col gap-6">
          <Mark
            {...markProps(feature.mark)}
            onInk={onInk}
            className={`${markTone} ${feature.body ? 'w-[37px]' : 'w-[59px]'}`}
          />
          {/*
           * `Body/Large` — 28/38 regular, no tracking. `text-display-md` is
           * the 28px step; its −0.0286em is the case-study h3's and does not
           * belong on a line this short, so it is overridden rather than a
           * fifth level being invented for one band.
           */}
          {feature.heading ? (
            <DisplayHeading
              as={featureTag}
              level="md"
              className="text-balance leading-[1.357] tracking-normal"
            >
              {feature.heading}
            </DisplayHeading>
          ) : null}
          {feature.body ? (
            <p className={`text-body leading-[1.2] ${onInk ? 'text-white/65' : 'text-fg-muted'}`}>
              {feature.body}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )

  /*
   * `2341:2231` — 48px above and below, a 139px gutter between the two
   * columns, and a hairline under every row including the last. The rule is
   * `border-b` on each row rather than `divide-y`, because the frame draws one
   * under the final row too.
   */
  const rows = (
    <ul className="flex flex-col">
      {items.map((feature) => (
        <li
          key={feature._key}
          className="border-fg-muted flex flex-col gap-6 border-b py-8 lg:flex-row lg:items-center lg:gap-[139px] lg:py-12"
        >
          <div className="flex items-center gap-8 lg:w-[609px] lg:shrink-0">
            <Mark {...markProps(feature.mark)} onInk={onInk} className={`${markTone} w-[75px]`} />
            {feature.heading ? (
              <DisplayHeading as={featureTag} level="lg" className="tracking-[-0.0222em]">
                {feature.heading}
              </DisplayHeading>
            ) : null}
          </div>
          {feature.body ? (
            <p className={`text-lead lg:w-[500px] ${onInk ? 'text-white/65' : 'text-fg-muted'}`}>
              {feature.body}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  )

  const composition = chosen === 'stack' ? stack : chosen === 'rows' ? rows : grid

  return (
    <SectionShell
      surface={resolved}
      top="md"
      bottom="md"
      width={orbital ? 'full' : 'section'}
      className={DECORATED_BAND_CLASS}
    >
      {/*
       * `2354:2551` — 1219px at 25%, hung off the right edge of the ink band
       * and running past its foot. 84.6% of the 1440 frame, anchored right so
       * the copy keeps the left of the band whatever the viewport does.
       */}
      <MoleculeDecoration
        decoration={decoration}
        surface={resolved}
        className="right-[-24%] top-1/4 w-[85vw] opacity-25"
      />

      <div className="flex flex-col gap-10 lg:gap-16">
        {heading ? <DisplayHeading>{heading}</DisplayHeading> : null}

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
