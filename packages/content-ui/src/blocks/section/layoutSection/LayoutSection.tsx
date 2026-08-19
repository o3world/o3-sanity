import type { ComponentType } from 'react'

import { DisplayHeading, Eyebrow, SectionShell } from '@o3/ui'
import type { SectionProps } from '@o3/content-runtime/blocks'
import { stegaClean } from '@sanity/client/stega'

import { BASE_BLOCK_COMPONENTS } from '../../base/baseComponents'
import { DECORATED_BAND_CLASS, resolveDecoration } from '../../decoration'
import { MoleculeDecoration } from '../../MoleculeDecoration'
import { resolveSurface } from '../../surface'

type LayoutSectionProps = SectionProps<'layoutSection'>

const COLUMN_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-3',
}

function resolveColumns(value: number | null | undefined): number {
  const clean = typeof value === 'number' ? value : Number(stegaClean(String(value ?? '')))
  return clean === 2 || clean === 3 ? clean : 1
}

/**
 * The one true two-tier block (ADR 0001): 1–3 columns of base-tier blocks.
 * Items dispatch through the typed base registry directly — the base tier
 * never contains sections, so the full registry isn't needed here.
 */
export function LayoutSection({
  eyebrow,
  heading,
  subheading,
  columns,
  decoration,
  items,
  surface,
}: LayoutSectionProps) {
  const columnClass = COLUMN_CLASSES[resolveColumns(columns)]
  const resolved = resolveSurface(surface, 'layoutSection')
  const showMolecule = resolveDecoration(decoration, 'layoutSection') === 'molecule'
  return (
    <SectionShell
      surface={resolved}
      top="md"
      bottom="md"
      // Only when decorated. A layout column holds arbitrary base blocks, and
      // an unconditional clip cuts the edge off any that overruns the band —
      // `/1682-conference-ai-innovation`'s CTA button is 13px wider than a
      // 390px viewport (#181) and loses the end of its label.
      className={showMolecule ? DECORATED_BAND_CLASS : undefined}
    >
      {/*
       * `2357:2690` — the Solutions proof-point band hangs the molecule at
       * 1300px and 25%, running off the band's right edge and past its foot,
       * the same treatment `featureGridSection` gives "Why Sanity + O3"
       * (`2354:2551`).
       */}
      <MoleculeDecoration
        decoration={decoration}
        block="layoutSection"
        surface={resolved}
        className="right-[-28%] top-0 w-[90vw] opacity-25"
      />
      <div className="flex flex-col gap-12">
        {/*
         * The three-part band header the interior frames use everywhere
         * (`1924:5344`): a neutral eyebrow, the 48px heading, and a set-back
         * second line at the same size. The subheading is `text-fg-muted`
         * rather than a smaller step — the frame keeps it at 36px and drops
         * the value, which is what makes it read as a continuation of the
         * heading rather than a standfirst.
         */}
        {eyebrow || heading || subheading ? (
          <header className="flex flex-col gap-4">
            {eyebrow ? <Eyebrow size="lg">{eyebrow}</Eyebrow> : null}
            {heading ? <DisplayHeading>{heading}</DisplayHeading> : null}
            {subheading ? (
              <p className="text-display-lg font-display text-fg-muted text-balance">
                {subheading}
              </p>
            ) : null}
          </header>
        ) : null}
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
        <div className={`grid items-start gap-10 ${columnClass}`}>
          {(items ?? []).map((item) => {
            const Component = Object.prototype.hasOwnProperty.call(
              BASE_BLOCK_COMPONENTS,
              item._type,
            )
              ? (BASE_BLOCK_COMPONENTS[item._type as keyof typeof BASE_BLOCK_COMPONENTS] as
                  ComponentType<Record<string, unknown>> | undefined)
              : undefined
            if (!Component) return null
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { _type, ...props } = item
            return <Component key={item._key} {...props} />
          })}
        </div>
      </div>
    </SectionShell>
  )
}
