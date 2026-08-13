'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { CarouselControl } from '@o3/ui'

export interface CarouselTrackProps {
  heading?: string | null
  /** Pre-rendered cards. Server components stay on the server; only the
      scrolling shell is client-side. */
  cards: readonly ReactNode[]
}

/**
 * The Blog band's card set — a carousel at **every** width since #90.
 *
 * ADR 0006 listed this as one of three structurally-divergent sections,
 * because the 402 frame it read (`1814:1738`) stacked the cards vertically
 * with **no prev/next controls at all**, and only the 1440 frame
 * (`1683:2470`) drew the overflowing track plus its two buttons. The
 * 2026-08-13 sync found that premise gone: the shared `Blog` component set
 * (`2205:1146`) now has a `Property 1=Mobile` variant (`2204:1145`) whose
 * heading is re-laid **vertically** — subhead, then a 32px gap, then the same
 * two `Icon Button`s the desktop variant carries (`2209:2566`). That is
 * authored, not left over: a horizontal heading row had no space for them.
 * See the amendment on ADR 0006.
 *
 * So the composition is one thing at both widths — a native scroll container
 * with snap points, one card per view below `lg` (the frame's 370px card is
 * its container's full width) and the frame's 394.67px card at `lg`. Native
 * rather than a transform-driven track because it keeps keyboard, trackpad
 * and touch scrolling working, and the controls just call `scrollBy`. Each
 * step is one card plus the 32px gap the frame gives at **both** widths.
 *
 * The one thing the mobile variant still draws that this does not follow is
 * its `Row`, which is a vertical stack of two cards. Controls are only
 * meaningful over a track that moves, so drawing both would mean shipping a
 * dead prev/next pair on every phone; the controls are the newer and more
 * specific signal, and they decide it. Reverting is the `lg:` prefixes on the
 * `<ul>` and its `<li>`, nothing else.
 *
 * The whole thing renders inside the SectionShell's standard 1248px column —
 * see the note on the `<ul>`.
 *
 * Controls disable at each end, and hide entirely when everything already
 * fits — a dead prev/next pair on a three-card row is worse than none.
 */
export function CarouselTrack({ heading, cards }: CarouselTrackProps) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(true)

  const sync = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    setAtStart(track.scrollLeft <= 1)
    setAtEnd(track.scrollLeft >= max - 1)
  }, [])

  useEffect(() => {
    sync()
    const track = trackRef.current
    if (!track) return
    const observer = new ResizeObserver(sync)
    observer.observe(track)
    return () => observer.disconnect()
  }, [sync])

  const step = (direction: 1 | -1) => {
    const track = trackRef.current
    if (!track) return
    // One card + the frame's 32px gap. Falls back to a viewport-width nudge if
    // the first child has not laid out yet.
    const card = track.firstElementChild
    const distance = card ? card.clientWidth + 32 : track.clientWidth * 0.8
    track.scrollBy({ left: distance * direction, behavior: 'smooth' })
  }

  const scrollable = !(atStart && atEnd)

  return (
    <>
      {/* `2134:1179` / `2177:1428` — one row at 1440 with the buttons pushed
          to the far edge, stacked at 402 with the frame's 32px gap between
          subhead and buttons. 48px to the row either way. */}
      <div className="mb-12 flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
        {heading ? (
          <h2 className="text-display-xl font-display text-balance">{heading}</h2>
        ) : (
          <span />
        )}
        {scrollable ? (
          <div className="flex shrink-0 gap-5">
            <CarouselControl direction="prev" onClick={() => step(-1)} disabled={atStart} />
            <CarouselControl direction="next" onClick={() => step(1)} disabled={atEnd} />
          </div>
        ) : null}
      </div>

      {/*
       * The scroll container is the SectionShell column itself, so scrolled
       * cards clip at the 1248px content edges — never past the margins. At
       * that measure the resting row is exactly three cards (394 × 3 + two
       * 32px gaps = 1246); the 1440 frame's bleed past the right edge is
       * deliberately not kept, and the prev/next controls carry the "this
       * scrolls" affordance. Below `lg` the same column is one card wide, so
       * the resting row is one card and the controls page through them.
       */}
      <ul
        ref={trackRef}
        onScroll={sync}
        className="flex snap-x snap-mandatory gap-8 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, index) => (
          <li key={index} className="w-full shrink-0 snap-start lg:w-[394px]">
            {card}
          </li>
        ))}
      </ul>
    </>
  )
}
