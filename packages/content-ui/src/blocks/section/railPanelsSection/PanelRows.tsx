import { DisplayHeading, Eyebrow } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'

export interface PanelRowDetail {
  _key?: string
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
 * `layout: rows` — the partner page's "Three Core Services" (`2749:6863`).
 *
 * ```
 * row  py 64, 1px #76746F under            numeral 75 ink circle, 36 to the copy
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
 * **The last detail is the promise, and takes brand red.** The frame draws the
 * breakdown label in ink (`2975:9554`, `#0A0A0B`) and the outcome's — "what you
 * get:" — in `#EB1000` (`2975:9560`), and every canonical service row is
 * breakdown-then-outcome, so the accent follows position rather than a field.
 * `Eyebrow` has no ink tone — its three are the shared vocabulary — so the ink
 * one is named as a class here, the same escape the Case Study Card set takes
 * for its deeper red. A band that one day wants
 * three neutral details and a red one in the middle is where this becomes a
 * knob; nothing draws that today, and a boolean per detail would be a design
 * option hiding in an editorial field.
 *
 * At 402 (`2975:9343`) the badge keeps its 75px circle and moves onto its own
 * line above the copy, and the 394px and 608px columns stack under it: the
 * circle plus a 394px column does not fit beside a phone's measure.
 */
export function PanelRows({ items }: PanelRowsProps) {
  return (
    <ol className="flex flex-col">
      {items.map((panel, index) => (
        <li
          key={panel.key}
          data-sanity={panel.dataSanity}
          className="border-fg-muted flex flex-col gap-9 border-b py-16 first:pt-0 lg:flex-row"
        >
          {/* 75px ink circle, the numeral in the 28px step at white. */}
          <span
            aria-hidden="true"
            className="bg-ink text-display-md flex size-[75px] shrink-0 items-center justify-center rounded-full leading-none text-white"
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
                  <div key={detail._key ?? detailIndex} className="flex flex-col gap-3">
                    {detail.label ? (
                      <Eyebrow
                        size="lg"
                        tone={isPromise ? 'brand' : 'muted'}
                        className={isPromise ? undefined : 'text-ink'}
                      >
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
                      {(detail.items ?? []).filter(Boolean).map((item, itemIndex) => (
                        <p key={itemIndex}>{item}</p>
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
