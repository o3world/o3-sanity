'use client'

import { useEffect, useState } from 'react'

import { cn } from '@o3/ui/lib/utils'

export interface PanelRailProps {
  /** One entry per panel, already resolved to what the rail should show. */
  items: readonly { key: string; label: string }[]
  /** DOM ids of the panels, in the same order — what the rail tracks. */
  panelIds: readonly string[]
  /** `number` draws the active item as a reversed ink chip (`1744:1786`). */
  mode: 'label' | 'number'
}

/**
 * The rail beside the panels (`1762:2135`) — 82px wide, 16px between items.
 *
 * The frame can only draw one state, so it shows the first item active and
 * everything else set back; what it is describing is a **scroll-linked**
 * highlight, which is why the panels below it fade to 20% as they leave. That
 * is the one thing static frames cannot express (#33), so the reading is made
 * explicit here: the rail marks whichever panel currently owns the viewport.
 *
 * | Mode     | Active                                   | Inactive                |
 * | -------- | ---------------------------------------- | ----------------------- |
 * | `label`  | 9px ink dot + label, flush left          | flush **right**, 50%    |
 * | `number` | white numeral in a 48px ink chip         | plain ink numeral       |
 *
 * Falls back to marking the first item when IntersectionObserver never fires,
 * so the no-JS and reduced-motion renders match the frame rather than going
 * blank.
 */
export function PanelRail({ items, panelIds, mode }: PanelRailProps) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const nodes = panelIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null)
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // The panel closest to the viewport's middle wins, so a tall panel
        // scrolling past does not hand the rail to its neighbour early.
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!visible) return
        const index = nodes.indexOf(visible.target as HTMLElement)
        if (index >= 0) setActive(index)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.5, 1] },
    )
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [panelIds])

  return (
    <ol className="hidden w-[82px] shrink-0 flex-col gap-4 self-start lg:sticky lg:top-40 lg:flex">
      {items.map((item, index) => {
        const isActive = index === active
        if (mode === 'number') {
          return (
            <li key={item.key} className="flex justify-end">
              <span
                className={cn(
                  'duration-(--duration-hover) flex h-12 w-[68px] items-center justify-center text-[36px] leading-none tracking-[-0.0262em] transition-colors ease-out',
                  isActive ? 'bg-ink text-white' : 'text-ink',
                )}
              >
                {item.label}
              </span>
            </li>
          )
        }
        return (
          <li
            key={item.key}
            className={cn(
              'duration-(--duration-hover) flex items-center gap-2 text-[24px] font-medium tracking-[-0.0333em] transition-opacity ease-out',
              isActive ? 'justify-start opacity-100' : 'justify-end opacity-50',
            )}
          >
            {isActive ? (
              <span aria-hidden="true" className="bg-ink-deep size-[9px] shrink-0 rounded-full" />
            ) : null}
            {item.label}
          </li>
        )
      })}
    </ol>
  )
}
