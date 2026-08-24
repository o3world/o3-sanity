import { cn } from '@o3/ui/lib/utils'

export interface PanelRailProps {
  /** One entry per panel, already resolved to what the rail should show. */
  items: readonly { key: string; label: string }[]
  /** Index of the panel that currently owns the viewport — see `PanelBand`. */
  active: number
  /** `number` draws the active item as a reversed ink chip (`1744:1786`). */
  mode: 'label' | 'number'
}

/**
 * The rail that counts the panels off — `2747:4491` at 1440, `2975:8193` at
 * 402, both named `Fixed Navigation` on the frame.
 *
 * The frame can only draw one state, so it shows the first item active and
 * everything else set back; what it is describing is a **scroll-linked**
 * highlight, which is the one thing static frames cannot express (#33). The
 * scroll tracking lives in `PanelBand`; this component only draws the state it
 * is handed.
 *
 * | Mode     | Where                | Active                              | Inactive       |
 * | -------- | -------------------- | ----------------------------------- | -------------- |
 * | `label`  | column at 1440       | 3 × 20 red bar, 8 clear of the word | bar unpainted  |
 * | `label`  | **tab row** at 402   | 2px red rule under the word         | no rule        |
 * | `number` | column at 1440       | white numeral in a 48px ink chip    | plain numeral  |
 *
 * The label rail's two drawings are one state read twice: a sticky 82px column
 * has nowhere to stand at 402, so the stops lay out as a row over the panels
 * instead of beside them, and the marker moves from the word's left edge to
 * under it. Nothing scrolls — three 24px labels 64 apart fit the 354px column.
 *
 * The number rail keeps the column and nothing else: its 402 composition is
 * the numeral inlined into each row, which the section draws, not this.
 */
export function PanelRail({ items, active, mode }: PanelRailProps) {
  if (mode === 'number') {
    return (
      <ol className="hidden w-[82px] shrink-0 flex-col gap-4 self-start lg:sticky lg:top-40 lg:flex">
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
    <ol
      // `items-start` so the active stop's rule hangs below its own word
      // rather than stretching every stop to the tallest.
      className="flex items-start gap-16 lg:sticky lg:top-40 lg:w-[82px] lg:shrink-0 lg:flex-col lg:gap-8 lg:self-start"
    >
      {items.map((item, index) => {
        const isActive = index === active
        return (
          <li
            key={item.key}
            className={cn(
              // 24/28.8 Medium at −0.8px, the same label on both frames.
              'duration-(--duration-hover) flex items-center gap-2 text-[24px] font-medium leading-[1.2] tracking-[-0.0333em] transition-colors ease-out',
              'border-b-2 lg:border-b-0 lg:pb-0',
              isActive ? 'border-brand pb-3' : 'border-transparent',
            )}
          >
            {/* The column's marker, and the one part of the row the 402 frame
                leaves unpainted — it draws the rule under the word instead. */}
            <span
              aria-hidden="true"
              className={cn(
                'duration-(--duration-hover) hidden h-5 w-[3px] shrink-0 transition-colors ease-out lg:block',
                isActive ? 'bg-brand' : 'bg-transparent',
              )}
            />
            {item.label}
          </li>
        )
      })}
    </ol>
  )
}
