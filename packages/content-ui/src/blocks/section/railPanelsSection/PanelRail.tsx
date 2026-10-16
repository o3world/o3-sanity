import { cn } from '@o3/ui/lib/utils'

export interface PanelRailItem {
  key: string
  label: string
  /** The panel's DOM id, so a label stop can send the reader to it. */
  panelId: string
}

export interface PanelRailProps {
  /** One entry per panel, already resolved to what the rail should show. */
  items: readonly PanelRailItem[]
  /** Index of the panel that currently owns the viewport — see `PanelBand`. */
  active: number
  /** `number` draws the active item as a reversed ink chip (`1744:1786`). */
  mode: 'label' | 'number'
}

/**
 * The rail that counts the panels off — `2747:4491` at 1440, named
 * `Fixed Navigation` on the frame. It is a column at `lg` and absent below it.
 *
 * The frame can only draw one state, so it shows the first stop active and
 * everything else set back; what it is describing is a **scroll-linked**
 * highlight, which is the one thing static frames cannot express (#33). The
 * scroll tracking lives in `PanelBand`; this component draws the state it is
 * handed and sends a reader the other way.
 *
 * | Mode     | Active                              | Inactive      |
 * | -------- | ----------------------------------- | ------------- |
 * | `label`  | 3 × 20 red bar, 8 clear of the word | bar unpainted |
 * | `number` | white numeral in a 48px ink chip    | plain numeral |
 *
 * **The stops are links**: each one jumps to its panel, and the observer then
 * marks it. Below `lg` there is no label rail. The 402 frame (`2975:8193`)
 * draws a tab row there, but design dropped it: each panel carries its own
 * title, so a row of stops would only repeat what the reader scrolls past.
 *
 * The number rail keeps the column and nothing else: its 402 composition is
 * the numeral inlined into each row, which the section draws, not this.
 */
export function PanelRail({ items, active, mode }: PanelRailProps) {
  if (mode === 'number') {
    return (
      <ol className="hidden w-[82px] shrink-0 flex-col gap-4 self-start lg:sticky lg:top-[calc(var(--spacing-nav-pinned)+96px)] lg:flex">
        {items.map((item, index) => (
          <li key={item.key} className="flex justify-end">
            <span
              className={cn(
                'duration-(--duration-hover) flex h-12 w-[68px] items-center justify-center text-[36px] leading-none tracking-[-0.0262em] transition-colors ease-out',
                index === active ? 'bg-ink text-white' : 'text-ink',
              )}
            >
              {item.label}
            </span>
          </li>
        ))}
      </ol>
    )
  }

  return (
    // `items-start` keeps each stop, and its focus ring, the width of its word.
    <ol className="hidden w-[82px] shrink-0 flex-col items-start gap-8 self-start lg:sticky lg:top-[calc(var(--spacing-nav-pinned)+96px)] lg:flex">
      {items.map((item, index) => {
        const isActive = index === active
        return (
          <li key={item.key}>
            <a
              href={`#${item.panelId}`}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                // 24/28.8 Medium at −0.8px.
                'duration-(--duration-hover) focus-visible:ring-brand flex items-center gap-2 text-[24px] font-medium leading-[1.2] tracking-[-0.0333em] transition-colors ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-4',
                isActive
                  ? 'text-ink [[data-surface=charcoal]_&]:text-white [[data-surface=ink]_&]:text-white'
                  : 'text-fg-body',
              )}
            >
              {/* The column's marker. */}
              <span
                aria-hidden="true"
                className={cn(
                  'duration-(--duration-hover) h-5 w-[3px] shrink-0 transition-colors ease-out',
                  isActive ? 'bg-brand' : 'bg-transparent',
                )}
              />
              {item.label}
            </a>
          </li>
        )
      })}
    </ol>
  )
}
