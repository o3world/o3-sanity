import { SectionShell, Stat } from '@o3/ui'
import { resolveSurface, sectionBackground } from '@o3/content-ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { itemAttr } from '@o3/content-runtime/data-attribute'
import { stegaClean } from '@sanity/client/stega'

/**
 * FIGURES AS A BAND — `1883:3565`'s stat vocabulary, the large light value
 * beside its muted label, in the two shapes the `layout` knob names.
 *
 * ```
 * columns   the 1248 measure, one column per stat, however many there are
 *           two-up at 402
 * stacked   the 822 article measure, one per row, a hairline above each
 * ```
 *
 * **App-local, and O3's alone** (ADR 0028): `statsSection` is on this brand's
 * half of the section roster. O3XO plates each figure on `accent` (`Key Metric
 * Card`, `4404:3916`) and draws no row of them, so a renderer in
 * `@o3/content-ui` would be one nothing else imports — the same call
 * `APP_FIRST_RENDERERS` already records about `statGroup`.
 *
 * **The Case Study frame draws no stats region**, so the two layouts answer to
 * the vocabulary rather than to a frame. `stacked` is the shape the case-study
 * detail carried as a fixed band before the block existed: on the article
 * measure, so the page keeps one spine with the chapters around it.
 *
 * `columns` divides the band by the number of stats rather than by a column
 * count, which is why the knob has two values and not four: three figures and
 * four figures are the same option answered with different content.
 *
 * The band takes the `sm` rhythm step at both edges. Its neighbours in a
 * narrative are chapters, which carry their own air, and a `lg` pair between
 * two of them reads as the band having lost its place.
 */
export function StatsSection({
  stats,
  layout,
  surface,
  backgroundMedia,
  loc,
}: SectionProps<'statsSection'>) {
  if (!stats?.length) return null
  const resolved = resolveSurface(surface, 'statsSection')
  // One value tested rather than a table mirroring the knob's declaration:
  // anything else, unset included, draws the `columns` the knob defaults to.
  const stacked = stegaClean(layout) === 'stacked'

  return (
    <SectionShell
      surface={resolved}
      top="sm"
      bottom="sm"
      width={stacked ? 'article' : 'section'}
      background={sectionBackground(backgroundMedia, resolved)}
    >
      {/*
       * A `<ul>`, not a `<dl>`. `Stat` renders a `<p>` holding the figure and
       * its label together, and a `<dl>` may only directly contain `dt` / `dd`
       * / `div` / `script` / `template` — so the list markup would be invalid
       * on every page drawing the band. It is also the wrong shape: a figure
       * and its label are one item, not a term and its definition.
       */}
      <ul
        className={
          stacked
            ? 'flex w-full flex-col gap-6'
            : 'grid grid-cols-2 gap-8 lg:flex lg:flex-row lg:gap-8'
        }
      >
        {stats.map((stat) => (
          <li
            key={stat._key}
            data-sanity={itemAttr(loc, 'stats', stat._key)}
            className={
              stacked ? 'border-line border-t pt-6 first:border-t-0 first:pt-0' : 'lg:flex-1'
            }
          >
            <Stat value={stat.value ?? ''} label={stat.label ?? ''} />
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}
