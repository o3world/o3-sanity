import { DisplayHeading, OrbitalDiagram, SectionShell } from '@o3/ui'
import { stegaClean } from '@sanity/client/stega'

import { Mark, markProps } from '@/content/blocks/base/mark/Mark'
import { resolveSurface } from '@/content/blocks/surface'
import type { SectionProps } from '@/content/blocks/sectionTypes'

type DisciplineGridSectionProps = SectionProps<'disciplineGridSection'>

/**
 * Section block: the four disciplines, in the two compositions the canonical
 * frames draw them in — #56, surfaced by #46 and #47.
 *
 * **`grid` — About `1925:5915`.**
 *
 * ```
 * 128px 0, gap 65
 *   header  padding-left 96      48px heading, flush left
 *   body    padding 0 96         two rows, space-between
 *     cell  48px 32px, gap 32    disc 138 | name 36px / body 24px in 560
 * ```
 *
 * **`orbital` — Solutions `1928:6524`.** The same four disciplines on a
 * 1120×1172 dotted tetrahedron. See `OrbitalDiagram` for why that is a new
 * drawing rather than `OrbitalSphere` plus labels.
 *
 * **One block, one `layout` field, not two blocks.** The two bands carry
 * identical content — four `{heading, body}` pairs — and differ only in how
 * they are arranged, which is the same test `railPanelsSection`'s `rail` field
 * passed. Two block types would have made "add a discipline" a question about
 * which page you were on.
 *
 * **The mark is per discipline** (`Mark`): the animated orb by default, the
 * frame's halftone disc when a row asks for it, so a band can mix them. It
 * applies to the `grid` composition only — the orbital diagram draws its own
 * nodes into one 1120×1172 canvas and has no slot to swap.
 *
 * The orbital composition is `lg` and up. 1120px of absolutely-positioned copy
 * has no honest 402 form and no 402 frame to copy, so below `lg` it falls back
 * to the grid — which is the same content in a shape that does work there
 * (ADR 0006).
 */
export function DisciplineGridSection({
  heading,
  layout,
  disciplines,
  surface,
}: DisciplineGridSectionProps) {
  const items = disciplines ?? []
  const orbital = stegaClean(layout) === 'orbital'
  const onInk = resolveSurface(surface, 'white') === 'ink'

  /**
   * A discipline sits under the band's own heading, so it is normally an `h3`.
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
  const disciplineTag = heading ? 'h3' : 'h2'

  const grid = (
    <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
      {items.map((discipline) => (
        <div key={discipline._key} className="flex items-center gap-8 py-8 lg:px-8 lg:py-12">
          {/* 138px on the frame. A disc here draws at the ink the frame
                  uses (#0A0A0A — `text-ink`, not the band's #232323 body
                  colour); on ink, white is the only honest inversion. */}
          <Mark
            {...markProps(discipline.mark)}
            onInk={onInk}
            className={onInk ? 'lg:w-34.5 w-20 text-white' : 'text-ink lg:w-34.5 w-20'}
          />
          <div className="flex flex-col justify-center gap-2">
            {discipline.heading ? (
              <DisplayHeading as={disciplineTag} level="lg" className="tracking-[-0.0222em]">
                {discipline.heading}
              </DisplayHeading>
            ) : null}
            {discipline.body ? (
              <p className="text-lead leading-[1.2] tracking-normal">{discipline.body}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <SectionShell
      surface={resolveSurface(surface, 'white')}
      top="md"
      bottom="md"
      width={orbital ? 'full' : 'section'}
    >
      <div className="flex flex-col gap-10 lg:gap-16">
        {heading ? <DisplayHeading>{heading}</DisplayHeading> : null}

        {orbital ? (
          <>
            <div className="lg:hidden">{grid}</div>
            <div className="hidden lg:block">
              <OrbitalDiagram
                items={items.map((discipline) => ({
                  heading: discipline.heading ?? '',
                  body: discipline.body,
                }))}
              />
            </div>
          </>
        ) : (
          grid
        )}
      </div>
    </SectionShell>
  )
}
