'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@o3/ui/lib/utils'

import { STATEMENT_STEP } from './statementStep'

export interface PanelTrackItem {
  key: string
  heading?: string | null
  body?: string | null
  /** The quieter "Best when…" line at the foot of the column. */
  note?: string | null
  dataSanity?: string
}

export interface PanelTrackProps {
  items: readonly PanelTrackItem[]
  /** The band's heading, so the scroll region announces as something. */
  label?: string
}

/**
 * What the scroll region announces when the band carries no heading — a real
 * shape, and a focusable stop with no name is worse than a generic one.
 */
const UNNAMED = 'Panels'

/**
 * ms before the first column lifts. The band's own `SectionReveal` is already
 * a third of the way up by then, so the columns read as filling the band in
 * rather than as a second copy of its rise.
 */
const ENTRANCE_DELAY = 120

/** ms between one column's lift and the next — the left-to-right rhythm. */
const ENTRANCE_STAGGER = 100

/**
 * `layout: track` — Home's "How we work" (`2846:5480`, `2975:8355` at 402).
 *
 * The colours below are the frame's; the code names the token role nearest
 * each one, because none of the three has a token of its own.
 *
 * ```
 * rule   1px #E2DFD8 across the column   ink segment 1/n wide, at the scroll position
 *   63 below
 * track  row, gap 138                    columns 531 wide, hairline down the right
 *   column  pr 64, content 467
 *     .01     15/18 #B9B4A8, 6 under
 *     h3      64/76 −1px  (48/58 at 402)
 *     body    24/34, 24 above
 *     note    15/22.5 #6E6E6E in 390, 24 above, 32 under
 * ```
 *
 * Three columns at 531 + 138 do not fit the 1248 content column, and the
 * frame draws exactly that: two columns and the third off-canvas. So the row
 * is a native snap-scroller, and the rule above it is the scroll indicator
 * the frame draws statically — an ink third sitting under the first column.
 * Its length is `1/n` rather than the visible fraction, because the frame's
 * 409/1240 is a third of three panels and not the two-thirds a scrollbar would
 * report: it counts columns. Where it sits is the track's own travel, so it
 * starts under the first column as the frame draws it and finishes under the
 * last — an index would top out one short, because the last column comes into
 * view beside its neighbour rather than alone.
 *
 * **The numeral derives from array order**, the rule `PanelRail`'s `number`
 * mode and `PanelRows` already follow. Both visible columns in the frame read
 * `.03` — the component's default, overridden on neither instance.
 *
 * This is `PanelBand`'s sibling, not a fork of it: both are the section's
 * client boundary for one layout, and both turn scroll position into an
 * indicator. They share no code, because the readings have nothing in common —
 * that band asks the **viewport** which panel it is looking at, to fade the
 * others; this one asks its **own container** how far along it is.
 *
 * The container reading — `scrollLeft` against `scrollWidth - clientWidth`,
 * resynced on scroll and resize — is `CarouselTrack`'s, three lines of it,
 * arrived at independently. It stays copied rather than extracted: a shared
 * hook would be the two lines both write and neither would stop writing the
 * state it actually keeps, which is a 0–1 fraction here and a pair of
 * at-the-end booleans there. A third track is what would make it a seam.
 *
 * ## The entrance
 *
 * The columns arrive rather than sit there: opacity and a 24px rise, once, on
 * `--ease-spring` at `--duration-reveal`, each column `ENTRANCE_STAGGER` after
 * the one to its left. It is `Reveal`'s mechanic written onto the `<li>`
 * itself — both of that component's load-bearing branches included — because a
 * wrapper element between the `<ol>` and its items would cost the list its
 * semantics and the row its snap points.
 *
 * **Spring rather than the house `ease-out`, because of what it composes
 * with.** `SectionReveal` already rises the whole band 24px on `ease-out`, and
 * a second `ease-out` rise inside it is the same motion played twice. A spring
 * leaves the start line at rest, so through the band's own rise the columns
 * travel with it, and they lift only once it has nearly settled.
 *
 * **One reading for the whole track, not one per column.** The observer
 * watches the `<ol>`; every column then plays on its own delay whether or not
 * it is inside the horizontal fold. The alternative — a column entering as it
 * is scrolled to sideways — would put motion under the finger that is doing
 * the scrolling, and the rule above the track is already the thing that
 * answers where you are in the set.
 *
 * ## At 402
 *
 * The same track, one column per view. The frame's column is 424 wide against
 * a 354 content column, so its 64px right padding and its hairline are already
 * off-canvas; below `lg` the column drops both and fills the width instead of
 * carrying a rule nobody sees. Nothing else changes — the mobile frame draws
 * the same four parts at the same steps, with the heading one size down.
 */
export function PanelTrack({ items, label }: PanelTrackProps) {
  const trackRef = useRef<HTMLOListElement>(null)
  const [scrolled, setScrolled] = useState(0)
  const [entered, setEntered] = useState(false)

  const sync = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const max = track.scrollWidth - track.clientWidth
    setScrolled(max > 0 ? track.scrollLeft / max : 0)
  }, [])

  useEffect(() => {
    sync()
    const track = trackRef.current
    if (!track) return
    // The travel changes with the measure, and the segment is a fraction of
    // it: without this a resize leaves the rule reporting the old geometry.
    const observer = new ResizeObserver(sync)
    observer.observe(track)
    return () => observer.disconnect()
  }, [sync])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setEntered(true)
      return
    }
    // `Reveal`'s fast path: a track already at or above the viewport plays now
    // rather than waiting to re-enter, which it never would.
    if (track.getBoundingClientRect().top < window.innerHeight) {
      setEntered(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEntered(true)
            io.disconnect()
          }
        }
      },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(track)
    return () => io.disconnect()
  }, [])

  const columns = Math.max(items.length, 1)

  return (
    <div className="flex w-full flex-col">
      {/* Decorative: the `<ol>` under it already carries the count and the
          order, and a scroll position is not something to announce twice. */}
      <div aria-hidden="true" className="bg-line relative h-px w-full overflow-hidden">
        <span
          // No transition: the segment follows the finger, and easing it would
          // leave it trailing the columns it reports on.
          className="bg-fg absolute inset-y-0 left-0 block"
          style={{
            width: `${100 / columns}%`,
            // Its own width per column travelled, so a track at rest puts the
            // segment under the first column — what the frame draws — and a
            // track scrolled to the end puts it under the last.
            transform: `translateX(${scrolled * (columns - 1) * 100}%)`,
          }}
        />
      </div>

      <ol
        ref={trackRef}
        onScroll={sync}
        // Focusable because it scrolls and holds nothing focusable of its own:
        // a keyboard reader that cannot reach the container cannot reach the
        // last column at all. `jsx-a11y/no-noninteractive-tabindex` reasons
        // from element semantics and this reasons from what a keyboard can
        // actually get to — the same tension `InFlightSection` resolved the
        // same way. `aria-label` is what stops it announcing as an unnamed
        // stop on the way past.
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard-scrollable region with no focusable content; see above
        tabIndex={0}
        aria-label={label ?? UNNAMED}
        className="focus-visible:ring-brand flex snap-x snap-mandatory gap-6 overflow-x-auto pt-16 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 lg:gap-[138px] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((panel, index) => (
          <li
            key={panel.key}
            data-sanity={panel.dataSanity}
            // What each app's `noscript` rule targets: with no JavaScript the
            // effect above never runs, so the stylesheet is the only thing
            // that can show the column.
            data-reveal=""
            style={{ transitionDelay: `${ENTRANCE_DELAY + index * ENTRANCE_STAGGER}ms` }}
            className={cn(
              'border-line flex w-full shrink-0 snap-start flex-col pb-8 lg:w-[531px] lg:border-r lg:pr-16',
              // `translate`, not `transform`: Tailwind v4 compiles
              // `translate-y-*` to the independent property (`@o3/ui`'s
              // `motion.ts`).
              'duration-(--duration-reveal) ease-spring transition-[opacity,translate]',
              'motion-reduce:transition-none',
              // `translate-none` rather than `translate-y-0`, so a settled
              // column leaves no containing block behind it.
              entered ? 'translate-none opacity-100' : 'translate-y-6 opacity-0',
            )}
          >
            <span aria-hidden="true" className="text-fg-subtle pb-1.5 text-[15px] leading-[18px]">
              {`.${String(index + 1).padStart(2, '0')}`}
            </span>

            {panel.heading ? (
              // 48/58 at 402 and 64/76 at 1440 — the step the rail header
              // sets too, so it is shared rather than written twice.
              <h3 className={cn('font-display text-balance', STATEMENT_STEP)}>{panel.heading}</h3>
            ) : null}

            {/* 24/34 on BOTH frames, so the solved clamp is flat — the one
                step on this band that does not interpolate. */}
            {panel.body ? <p className="pt-6 text-[24px] leading-[34px]">{panel.body}</p> : null}

            {panel.note ? (
              <p className="text-fg-muted pt-6 text-[15px] leading-[22.5px] lg:max-w-[390px]">
                {panel.note}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  )
}
