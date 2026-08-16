import { DisplayHeading, Eyebrow } from '@o3/ui'

import { Mark, markProps } from '@/content/blocks/base/mark/Mark'
import type { PanelRowDetail } from './PanelRows'

export interface PanelGridItem {
  key: string
  heading?: string | null
  mark?: Parameters<typeof markProps>[0]
  details?: readonly PanelRowDetail[] | null
  dataSanity?: string
}

export interface PanelGridProps {
  items: readonly PanelGridItem[]
  /** The band paints ink — every tone below flips to its white counterpart. */
  onInk?: boolean
}

/**
 * `layout: grid` — the redesigned Solutions frame's service grid
 * (`2358:2788`), #93.
 *
 * ```
 * three columns, gap 32, on the 1249 content column
 *   title  pb 12, gap 12      37px mark  |  28/38 heading
 *   list   pt 24, gap 24, 1px #76746F above
 *     pair gap 8              18px eyebrow in ink  |  24/34 body in #55524E
 * ```
 *
 * The same panel data the rail and rows layouts carry, set as columns: each
 * detail here is one labelled line rather than `PanelRows`' laid-across sets,
 * so the pairs stack plain — no numeral, and no promise-in-red, because the
 * frame draws every label in the same ink.
 *
 * The frame's eyebrows are ink (`#0A0A0B`), not the canonical section-eyebrow
 * grey — `text-fg` says so at the call site rather than growing `Eyebrow` a
 * fourth tone for one band.
 *
 * At 402 the columns stack; a three-across set of 395px columns has no honest
 * form there and the frame has no 402 to copy (ADR 0006 — the renderer
 * decides).
 */
export function PanelGrid({ items, onInk = false }: PanelGridProps) {
  const markTone = onInk ? 'text-white' : 'text-ink'
  return (
    <ul className="grid gap-12 lg:grid-cols-3 lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:gap-y-0">
      {items.map((panel) => (
        // Subgrid, so the three hairlines sit on one line: the title row takes
        // the tallest heading ("Headless & Composable Architecture" wraps to
        // two lines) and every column's list starts at the same y — which is
        // how the frame draws it, titles row above lists row (`2360:3034` /
        // `2360:2970`). The two explicit rows also cap the band at three
        // panels; the schema's grid gate holds the array to that.
        <li
          key={panel.key}
          data-sanity={panel.dataSanity}
          className="flex flex-col lg:row-span-2 lg:grid lg:grid-rows-subgrid"
        >
          <div className="flex flex-col gap-3 pb-3">
            <Mark {...markProps(panel.mark)} onInk={onInk} className={`${markTone} w-[37px]`} />
            {panel.heading ? (
              <DisplayHeading as="h3" level="md" className="leading-[1.357] tracking-normal">
                {panel.heading}
              </DisplayHeading>
            ) : null}
          </div>

          <dl className="border-fg-muted flex flex-col gap-6 border-t pt-6">
            {(panel.details ?? []).map((detail, detailIndex) => (
              <div key={detail._key ?? detailIndex} className="flex flex-col gap-2">
                {detail.label ? (
                  <dt>
                    <Eyebrow size="lg" className={onInk ? 'text-white' : 'text-fg'}>
                      {detail.label}
                    </Eyebrow>
                  </dt>
                ) : null}
                {(detail.items ?? []).filter(Boolean).map((item, itemIndex) => (
                  <dd
                    key={itemIndex}
                    className={`text-lead ${onInk ? 'text-white/65' : 'text-fg-body'}`}
                  >
                    {item}
                  </dd>
                ))}
              </div>
            ))}
          </dl>
        </li>
      ))}
    </ul>
  )
}
