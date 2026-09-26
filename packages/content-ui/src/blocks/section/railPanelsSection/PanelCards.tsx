import { Mark, markProps, type MarkProps } from '../../base/mark/Mark'

export interface PanelCard {
  key: string
  heading?: string | null
  body?: string | null
  note?: string | null
  /** The circle the frame centres on the card — an orb unless set to disc. */
  mark?: MarkProps | null
  /**
   * The panel's `data-sanity`, built by the section (#107). A pre-built
   * string rather than a location, so this presentational subcomponent stays
   * free of anything Sanity — it is handed one attribute value and stamps it.
   */
  dataSanity?: string
}

/** Current engagement columns (4030:38346), retaining the authored GPU marks. */
export function PanelCards({ items, onInk = false }: { items: PanelCard[]; onInk?: boolean }) {
  return (
    <div className="grid w-full gap-12 lg:grid-cols-3 lg:gap-8">
      {items.map((item) => (
        <article
          key={item.key}
          data-sanity={item.dataSanity}
          className="flex min-w-0 flex-col gap-6"
        >
          <Mark {...markProps(item.mark)} onInk={onInk} className="w-[66px]" />
          {item.heading ? (
            <h3 className="font-sans text-[28px] leading-[38px]">{item.heading}</h3>
          ) : null}
          {item.body || item.note ? (
            <p className={`text-[20px] leading-7 ${onInk ? 'text-white/65' : 'text-fg-body'}`}>
              {[item.body, item.note].filter(Boolean).join(' ')}
            </p>
          ) : null}
        </article>
      ))}
    </div>
  )
}
