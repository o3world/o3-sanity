'use client'

import type { ReactNode } from 'react'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from '@o3/ui'

export interface CarouselTrackProps {
  heading?: string | null
  /**
   * The band header's `data-sanity`, built by the section (#107). A
   * pre-built string rather than a location: this shell is also used by the
   * insight detail route's "Keep reading" band, which is markup rather than a
   * block and therefore has no location at all.
   */
  headingAttr?: string
  /** Pre-rendered cards. Server components stay on the server; only the
      scrolling shell is client-side. */
  cards: readonly ReactNode[]
}

/**
 * The prev/next pair in the header row, hidden entirely when everything
 * already fits — a dead pair on a three-card row is worse than none. Its own
 * component because the visibility reads Embla's state, which only exists
 * inside the `<Carousel>` boundary.
 */
function Controls() {
  const { canScrollPrev, canScrollNext } = useCarousel()
  if (!canScrollPrev && !canScrollNext) return null
  return (
    <div className="flex shrink-0 gap-5">
      <CarouselPrevious />
      <CarouselNext />
    </div>
  )
}

/**
 * The Blog band's card set — a carousel at **every** width since #90, on the
 * shared `Carousel` (Embla) primitive.
 *
 * The shared `Blog` component set (`2205:1146`) draws one composition at both
 * widths: heading row with the two `Icon Button`s (`2209:2566`) — horizontal
 * at 1440 (`2134:1179`), stacked with a 32px gap at 402 (`2204:1145`, an
 * authored variant: a horizontal heading row had no space for them) — over
 * the overflowing track. See the amendment on ADR 0006.
 *
 * The carousel viewport is the SectionShell column itself, so scrolled cards
 * clip at the 1248px content edges — never past the margins. At that measure
 * the resting row is exactly three cards (394 × 3 + two 32px gaps = 1246);
 * the 1440 frame's bleed past the right edge is deliberately not kept, and
 * the prev/next controls carry the "this scrolls" affordance. Below `sm` the
 * same column is one card wide — a full-width square card in the tablet
 * range towers over its copy, so only below `sm` does the card fill the
 * column — and the controls page through them.
 */
export function CarouselTrack({ heading, headingAttr, cards }: CarouselTrackProps) {
  return (
    <Carousel opts={{ align: 'start' }}>
      {/* One row at 1440 with the buttons pushed to the far edge, stacked at
          402 with the frame's 32px gap between subhead and buttons. 48px to
          the row either way. */}
      <div
        data-sanity={headingAttr}
        className="mb-12 flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between"
      >
        {heading ? (
          <h2 className="text-display-xl font-display text-balance">{heading}</h2>
        ) : (
          <span />
        )}
        <Controls />
      </div>

      {/* The frame's 32px gap at both widths; each step is one card. */}
      <CarouselContent className="gap-8">
        {cards.map((card, index) => (
          <CarouselItem key={index} className="sm:basis-[394px]">
            {card}
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  )
}
