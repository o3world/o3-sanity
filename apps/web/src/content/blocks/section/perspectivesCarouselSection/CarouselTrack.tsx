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
 * The scrolling half of the Blog band (`1683:2473`) — the card row and the two
 * `Icon / Surface` controls beside the heading (`1683:2470`).
 *
 * The row is a native scroll container with snap points rather than a
 * transform-driven track: it keeps keyboard and trackpad scrolling working,
 * and the controls just call `scrollBy`. Each step is one card plus the 32px
 * gap, read off the frame's 394.67px card.
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
      <div className="px-gutter mb-12 flex items-center justify-between gap-8">
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
       * `pl-gutter` and no right padding: the row starts on the gutter line
       * with the heading and runs off the right edge, exactly as the frame
       * draws it. `pr-gutter` on the last item restores a resting margin once
       * the row is scrolled to its end.
       */}
      <ul
        ref={trackRef}
        onScroll={sync}
        className="pl-gutter flex snap-x snap-mandatory gap-8 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {cards.map((card, index) => (
          <li
            key={index}
            className="w-[280px] shrink-0 snap-start last:mr-[var(--spacing-gutter)] lg:w-[394px]"
          >
            {card}
          </li>
        ))}
      </ul>
    </>
  )
}
