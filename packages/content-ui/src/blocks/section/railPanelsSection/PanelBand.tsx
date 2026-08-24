'use client'

import { useEffect, useState, type ReactNode } from 'react'

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
 * The rail-layout body band — the `Container` on `2747:4490`, and the
 * section's one client boundary.
 *
 * ```
 * 1440   row, gap 238    rail 82px sticky    |  panels, 128 apart
 *  402   column, gap 64  rail as a tab row   |  panels, 128 apart
 * ```
 *
 * What it owns is the one thing the frames cannot draw (#33): which panel the
 * viewport is looking at. The rail marks that panel and nothing else does, so
 * there is a single scroll-linked index here rather than an observer per
 * consumer — two could disagree in the gaps between panels, and a rail marking
 * a stop the reader has left is worse than a rail that never moves.
 *
 * Until the observer first fires — no JS, jsdom, print — `active` is `null`
 * and the rail marks the first stop, which is what both frames draw.
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
    <div className="flex w-full flex-col gap-16 lg:flex-row lg:gap-[238px]">
      <PanelRail mode={mode} items={railItems} active={active ?? 0} />

      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col',
          // 128 between panels at both widths (`2747:4501`, `2975:8203`).
          // The number rail keeps the 24 its own 402 rows sit at.
          mode === 'number' ? 'gap-6 lg:gap-32' : 'gap-32',
        )}
      >
        {children}
      </div>
    </div>
  )
}
