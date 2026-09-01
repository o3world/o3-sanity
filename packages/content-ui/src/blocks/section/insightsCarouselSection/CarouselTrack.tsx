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
 * THE TRACK RUNS OFF THE RIGHT EDGE OF THE SCREEN.
 *
 * The Blog set draws the row starting on the left gutter and continuing past
 * the frame's right edge (`2134:1352`), and that bleed is the band's affordance:
 * a row clipped on the content column reads as a row that ends, and the reader
 * has only the prev/next pair to tell them otherwise.
 *
 * The margin is the distance from the 1248px column's right edge to the
 * viewport's, negated, written as a `min()` of two terms rather than
 * `calc(50% - 50vw)` — a percentage margin resolves against the containing
 * block, so the tidy form is only right while the column is at its cap. Below
 * the cap the column is the viewport less two gutters and the gutter is the
 * whole distance; above it the column stops at 1248 and half of that is 624.
 * `min()` of two negatives takes the larger distance, which is whichever is in
 * force. `LayoutSection`'s bleeding media column is the same arithmetic.
 *
 * **From `sm` only, because below it the card IS the column.** A `basis-full`
 * slide measures against the viewport, so widening the viewport below `sm`
 * would make every card wider than the band's own column rather than sliding a
 * neighbour into view.
 */
const BLEED_VIEWPORT_CLASS = 'sm:mr-[min(calc(-1*var(--spacing-gutter)),calc(624px-50vw))]'

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
 * The header sits in the standard 1248px column and the track starts on its
 * left edge; only the track's viewport bleeds, and it bleeds to the right edge
 * of the screen (`BLEED_VIEWPORT_CLASS`). At the design width the resting row
 * is the frame's three cards on the column (394 × 3 + two 32px gaps = 1246)
 * with the fourth crossing the margin. Below `sm` the card fills the column,
 * the track does not bleed, and the controls page through them.
 *
 * **The band hosting this hands `CAROUSEL_BAND_CLASS` to its shell** — the
 * bleed is measured in `vw` and needs the clip to stay off the scrollbar. It
 * lives in `carouselBand.ts` because this module is client-side and a server
 * component cannot read a constant across that line.
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

      {/* The wrapper is what widens Embla's viewport: `CarouselContent` clips
          on its own parent's width, so the bleed belongs one level above it
          rather than on the track. */}
      <div className={BLEED_VIEWPORT_CLASS}>
        {/* The frame's 32px gap at both widths; each step is one card. */}
        <CarouselContent className="gap-8">
          {cards.map((card, index) => (
            <CarouselItem key={index} className="sm:basis-[394px]">
              {card}
            </CarouselItem>
          ))}
        </CarouselContent>
      </div>
    </Carousel>
  )
}
