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
 * The Blog band's card set — a **carousel only at `lg`**.
 *
 * ADR 0006 lists this as one of three structurally-divergent sections: the
 * 402 frame (`1814:1738`) stacks the cards vertically 48px apart (the 24px
 * inside `1814:1867` is the card's own media→info gap, not the row gap) with
 * **no prev/next controls at all**, and only the 1440 frame
 * (`1683:2470`) draws the overflowing track plus its two `Icon / Surface`
 * buttons. The track used to scroll horizontally at every width, which put a
 * 280px card and a hidden overflow affordance on a 402 phone — the divergence
 * this pass closes.
 *
 * So: base is a plain `flex-col` list; the scroll container, the snap points
 * and the 394px card all switch on at `lg`. The whole thing renders inside
 * the SectionShell's standard 1248px column — see the note on the `<ul>`.
 *
 * At `lg` the row is a native scroll container with snap points rather than a
 * transform-driven track: it keeps keyboard and trackpad scrolling working,
 * and the controls just call `scrollBy`. Each step is one card plus the 32px
 * gap, read off the frame's 394.67px card.
 *
 * Controls disable at each end, and hide entirely when everything already
 * fits — a dead prev/next pair on a three-card row is worse than none. Below
 * `lg` there is nothing to scroll, so `scrollWidth === clientWidth` keeps them
 * hidden on their own; the `lg:` on the wrapper says so out loud.
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
      <div className="mb-12 flex items-center justify-between gap-8">
        {heading ? (
          <h2 className="text-display-xl font-display text-balance">{heading}</h2>
        ) : (
          <span />
        )}
        {scrollable ? (
          <div className="hidden shrink-0 gap-5 lg:flex">
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
       * scrolls" affordance. Below `lg` nothing overflows.
       */}
      <ul
        ref={trackRef}
        onScroll={sync}
        className="flex flex-col gap-12 lg:snap-x lg:snap-mandatory lg:flex-row lg:gap-8 lg:overflow-x-auto lg:pb-2 lg:[scrollbar-width:none] lg:[&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, index) => (
          <li key={index} className="w-full lg:w-[394px] lg:shrink-0 lg:snap-start">
            {card}
          </li>
        ))}
      </ul>
    </>
  )
}
