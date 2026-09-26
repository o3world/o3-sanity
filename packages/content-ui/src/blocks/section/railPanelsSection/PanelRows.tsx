import { cn } from '@o3/ui/lib/utils'

export interface PanelRowDetail {
  _key?: string
  label?: string | null
  items?: readonly (string | null)[] | null
}

export interface PanelRowItem {
  key: string
  heading?: string | null
  note?: string | null
  body?: string | null
  details?: readonly PanelRowDetail[] | null
  dataSanity?: string
}

export interface PanelRowsProps {
  items: readonly PanelRowItem[]
  onInk?: boolean
  /** The rows layout authors an outcome last; the details-only grid does not. */
  lastDetailIsOutcome?: boolean
}

/** Current service lines (4068:50469): title, body/chips, rule, outcome. */
export function PanelRows({ items, onInk = false, lastDetailIsOutcome = true }: PanelRowsProps) {
  return (
    <ol className="divide-line flex flex-col divide-y">
      {items.map((panel) => {
        const details = panel.details ?? []
        const outcome = lastDetailIsOutcome && details.length > 1 ? details.at(-1) : undefined
        const breakdown = outcome ? details.slice(0, -1) : details
        return (
          <li
            key={panel.key}
            data-sanity={panel.dataSanity}
            className={cn(
              'grid gap-8 py-16 first:pt-0 last:pb-0',
              outcome
                ? 'lg:grid-cols-[minmax(0,395fr)_minmax(0,394fr)_minmax(0,75fr)_minmax(0,288fr)]'
                : 'lg:grid-cols-[minmax(0,395fr)_minmax(0,821fr)]',
            )}
          >
            <div className="flex min-w-0 flex-col gap-3">
              {panel.heading ? (
                <h3 className="font-display break-words text-[40px] leading-[44px] lg:text-[48px] lg:leading-[58px]">
                  {panel.heading}
                </h3>
              ) : null}
              {panel.note ? (
                <p className={cn('text-lead', onInk ? 'text-white/65' : 'text-fg-body')}>
                  {panel.note}
                </p>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-8">
              {panel.body ? <p className="text-[20px] leading-7">{panel.body}</p> : null}
              {breakdown.map((detail, index) => (
                <div key={detail._key ?? index} className="flex flex-col gap-4">
                  {detail.label ? (
                    <p
                      className={cn(
                        'text-[13px] font-bold uppercase leading-[15px] tracking-[1.3px]',
                        onInk ? 'text-white/65' : 'text-fg-body',
                      )}
                    >
                      {detail.label}
                    </p>
                  ) : null}
                  <ul className="flex flex-wrap gap-2">
                    {(detail.items ?? []).filter(Boolean).map((item, itemIndex) => (
                      <li
                        key={itemIndex}
                        className={cn(
                          'max-w-full rounded-full px-4 py-1 text-[14px] font-medium leading-5',
                          onInk ? 'bg-white/10' : 'bg-bone',
                        )}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {outcome ? (
              <>
                <div aria-hidden="true" className="hidden justify-center lg:flex">
                  <div className={cn('h-full w-px', onInk ? 'bg-white/20' : 'bg-line')} />
                </div>
                <div className="flex min-w-0 flex-col gap-4">
                  {outcome.label ? (
                    <p className="text-brand text-[13px] font-bold uppercase leading-[15px] tracking-[1.3px]">
                      {outcome.label}
                    </p>
                  ) : null}
                  {(outcome.items ?? []).filter(Boolean).map((item, index) => (
                    <p key={index} className="font-display text-[30px] leading-9">
                      {item}
                    </p>
                  ))}
                </div>
              </>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
