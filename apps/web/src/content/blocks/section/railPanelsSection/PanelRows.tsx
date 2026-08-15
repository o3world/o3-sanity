import { DisplayHeading, Eyebrow } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'

export interface PanelRowDetail {
  label?: string | null
  items?: readonly (string | null)[] | null
}

export interface PanelRowItem {
  key: string
  heading?: string | null
  /** The quieter line under the heading — "Move to Sanity without the chaos". */
  note?: string | null
  body?: string | null
  details?: readonly PanelRowDetail[] | null
  dataSanity?: string
}

export interface PanelRowsProps {
  items: readonly PanelRowItem[]
}

/**
 * `layout: rows` — the partner page's "Three Core Services" (`2334:2170`), #92.
 *
 * ```
 * row  gap 36, pb 64, 1px #76746F under          numeral 75 ink circle
 *   content  row, gap 140, 1142 wide
 *     left   394        h3 36/44  |  note 24/34 #55524E
 *     right  fill, gap 63
 *       body     24/34
 *       detail   18px eyebrow  |  items across, gap 30, 20/32 #55524E
 * ```
 *
 * **The numeral is derived from order**, the same rule `PanelRail`'s `number`
 * mode and `caseStudy.story`'s chapters already follow — never a string an
 * editor typed. The chip is a circle here where the rail draws a 48×68 square;
 * that is the composition differing, not the numbering.
 *
 * **The last detail is the promise, and takes brand red** (`2334:2166` against
 * `2334:2165`). The frame draws the breakdown in ink and the outcome in
 * `#EB1000`, and every canonical service row is breakdown-then-outcome — so
 * the accent follows position rather than a field. A band that one day wants
 * three neutral details and a red one in the middle is where this becomes a
 * knob; nothing draws that today, and a boolean per detail would be a design
 * option hiding in an editorial field.
 *
 * At 402 the two columns stack and the numeral leads the heading: a 394px
 * column beside a 608px one has no honest form there, and the frame has no 402
 * to copy (ADR 0006 — the renderer decides).
 */
export function PanelRows({ items }: PanelRowsProps) {
  return (
    <ol className="flex flex-col">
      {items.map((panel, index) => (
        <li
          key={panel.key}
          data-sanity={panel.dataSanity}
          className="border-fg-muted flex gap-6 border-b pb-10 pt-10 first:pt-0 lg:gap-9 lg:pb-16"
        >
          {/* 75px ink circle, the numeral in the 28px step at white. */}
          <span
            aria-hidden="true"
            className="bg-ink text-display-md flex size-12 shrink-0 items-center justify-center rounded-full leading-none text-white lg:size-[75px]"
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          <div className="flex flex-1 flex-col gap-8 lg:flex-row lg:gap-[140px]">
            <div className="flex flex-col gap-3 lg:w-[394px] lg:shrink-0">
              {panel.heading ? (
                <DisplayHeading as="h3" level="lg" className="tracking-[-0.0222em]">
                  {panel.heading}
                </DisplayHeading>
              ) : null}
              {panel.note ? <p className="text-lead text-fg-body">{panel.note}</p> : null}
            </div>

            <div className="flex flex-1 flex-col gap-10 lg:gap-[63px]">
              {panel.body ? <p className="text-lead">{panel.body}</p> : null}

              {(panel.details ?? []).map((detail, detailIndex, all) => {
                const isPromise = detailIndex === all.length - 1 && all.length > 1
                return (
                  <div key={detail.label ?? detailIndex} className="flex flex-col gap-3">
                    {detail.label ? (
                      <Eyebrow size="lg" tone={isPromise ? 'brand' : 'muted'}>
                        {detail.label}
                      </Eyebrow>
                    ) : null}
                    <div
                      className={cn(
                        'gap-y-2 text-[20px] leading-[1.6]',
                        // One item is a sentence in the ink the body uses; a
                        // set is laid across in the quieter body colour.
                        (detail.items ?? []).length > 1
                          ? 'text-fg-body grid gap-x-[30px] sm:grid-cols-2 lg:grid-cols-3'
                          : 'flex flex-col',
                      )}
                    >
                      {(detail.items ?? []).filter(Boolean).map((item) => (
                        <p key={item}>{item}</p>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
