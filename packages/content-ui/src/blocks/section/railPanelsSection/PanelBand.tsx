'use client'

import { Children, useEffect, useState, type ReactNode } from 'react'

import { cn } from '@o3/ui/lib/utils'

import { PanelRail } from './PanelRail'

export interface PanelBandProps {
  /** Rail entries, already resolved to what the rail should show. */
  railItems: readonly { key: string; label: string }[]
  /** DOM ids of the panels, in children order — what the band observes. */
  panelIds: readonly string[]
  /** `number` draws the active rail item as a reversed ink chip (`1744:1786`). */
  mode: 'label' | 'number'
  /** The panel articles, one per `panelIds` entry, in the same order. */
  children: ReactNode
}

/**
 * The rail-layout body band (`1762:2148`) — the sticky rail beside the panel
 * stack, and the section's one client boundary.
 *
 * The frame draws the interaction it cannot animate: the band appears twice,
 * the second copy at 20% opacity (`1899:4345`). That duplicate is not a second
 * panel — it is the mid-scroll state, the next plate waiting dimmed under the
 * active one. So the band owns a single scroll-linked active index and hands
 * it both ways: the rail marks the active item, every other plate sets back
 * to 20%.
 *
 * One index, one observer — the observer sat in `PanelRail` before this, and
 * a second one on the plates could disagree with it in the gaps between
 * panels. A rail marking plate 2 while plate 2 dims would be worse than no
 * interaction at all, which is why the state was lifted here instead.
 *
 * Until the observer first fires — no JS, jsdom, print — `active` is `null`:
 * the rail falls back to marking the first item (matching the frame) and no
 * plate dims, so a render the observer never reaches keeps every plate
 * readable instead of stranding four fifths of the section at 20%.
 */
export function PanelBand({ railItems, panelIds, mode, children }: PanelBandProps) {
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const nodes = panelIds
      .map((id) => document.getElementById(id))
      .filter((node): node is HTMLElement => node !== null)
    if (nodes.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // The panel closest to the viewport's middle wins, so a tall panel
        // scrolling past does not hand the band to its neighbour early.
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
    <div className="flex w-full gap-8 lg:gap-[238px]">
      <PanelRail mode={mode} items={railItems} active={active ?? 0} />

      <div className="flex min-w-0 flex-1 flex-col gap-6 lg:gap-[164px]">
        {Children.map(children, (child, index) => (
          <div
            className={cn(
              // The fade is a 1440 element like the rail it answers to:
              // neither 402 frame dims its compact rows.
              'duration-(--duration-ink) transition-opacity ease-out motion-reduce:transition-none',
              active !== null && active !== index && 'lg:opacity-20',
            )}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
