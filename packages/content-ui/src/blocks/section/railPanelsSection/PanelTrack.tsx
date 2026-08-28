'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

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
  /**
   * The band's server-rendered header row. It lives inside this component so
   * the drive's transit window is measured over the whole band — header,
   * rule and columns — rather than the columns alone.
   */
  header?: ReactNode
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
 * Where the walk ends when the clearance cannot be read: the track's top at
 * the clearance every sticky element on the page uses
 * (`--spacing-nav-offset` + 96px; 160px with the Utility Nav strip). Past
 * this the column heads would start leaving, so the last framing has to be
 * settled by here. The live value is read off the stage's own
 * `scroll-margin-top`, which derives from the token.
 */
const WALK_CLEARANCE = 160

/**
 * Where the walk begins: this much room under the track's foot — the rule
 * and every column fully on screen, at rest in the first framing, before
 * anything moves. The track rather than the whole band, because a band
 * whose header eats half a short viewport would otherwise start walking
 * before the reader has seen what walks.
 */
const WALK_FOOT_GAP = 48

/**
 * The least page scroll the walk may be mapped onto. A tall track in a short
 * viewport squeezes the fully-visible stretch toward nothing, and a walk
 * compressed into a few pixels of scroll is a flip; below this the window
 * opens upward from `WALK_CLEARANCE` instead, trading a little head-room
 * for a walk that still reads as motion.
 */
const WALK_MIN_SPAN = 160

/**
 * How much of the remaining distance the track closes per frame. The walk's
 * window is a fraction of the travel it drives, so the raw mapping is fast
 * and the wheel hands it discrete steps besides; the chase is what turns
 * both into a glide.
 */
const DRIVE_EASE = 0.12

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
 * state it actually keeps, which is a custom property on the rule here and a
 * pair of at-the-end booleans there. A third track is what would make it a
 * seam.
 *
 * The fraction lands on the rule as `--track-progress` rather than in React
 * state, `ReadingProgress`'s idiom: the page's own scroll drives this track
 * (below), so a `setState` here would be a render of the band on every frame
 * of a scroll past it.
 *
 * ## The advance
 *
 * On a fine pointer the track walks as it transits the viewport: the walk
 * maps onto the stretch of page scroll in which the rule and every column
 * are on screen — from fully entered (`WALK_FOOT_GAP` under the track's
 * foot) to the nav clearance from the top — with the track CHASING the
 * mapped target (`DRIVE_EASE`) rather than mirroring it, so the step lands
 * as a glide. The window is measured over the track rather than the whole
 * band: the header above it only has to have been seen, not to still be on
 * screen, and holding the walk for it would start the advance early on any
 * viewport short enough that band-plus-header never fits at once.
 * Nothing pins and nothing is held open: the section keeps exactly the
 * height it has, the page never stops moving, and the bands around this one
 * are undisturbed. On desktop two columns fit the view, so the walk IS one
 * step — the [1 2] framing hands over to [2 3] — and both framings are on
 * screen in full before and after it. The rule above reads `scrollLeft`, so
 * it keeps reporting the truth without knowing who moved the track.
 *
 * **Snap is off wherever the drive can run at all, and it is a whole-visit
 * decision rather than a per-frame one.** A programmatic `scrollLeft` against
 * `snap-mandatory` is two things deciding where the track sits, and the
 * browser wins between frames. Turning snapping back on the instant a hand
 * lands would be worse than that: the track is between columns when the drive
 * lets go, so the browser snaps it to the nearest one and the columns jump out
 * from under the finger that just touched them — up to a third of a column at
 * the desktop measure. Off it stays.
 *
 * **A hand on the track ends the drive**, on pointer, touch, key, focus or a
 * wheel with sideways intent — a reader who has taken hold of the columns is
 * not to be argued with. The drive re-arms when the band has left the
 * viewport entirely, so the next visit advances again and the visit that was
 * taken over stays taken over.
 *
 * **Not on a coarse pointer, and not under reduced motion.** On touch the
 * track is the page's own swipe surface and a drive would be pulling against
 * the thumb doing the swiping; under reduced motion it is geometry moving
 * that nobody asked to move. Both are read from `matchMedia` and both listen
 * for the preference changing. Neither case gives up its snapping: where the
 * drive never runs, the track is exactly the one the frame draws.
 *
 * ## The entrance
 *
 * The columns arrive rather than sit there: opacity and a 24px rise, once, on
 * `--ease-spring` at `--duration-reveal`, each column `ENTRANCE_STAGGER` after
 * the one to its left. It is `Reveal`'s mechanic written onto the `<li>`
 * itself — the same inversion included: the server ships the columns painted,
 * and only a track still below the viewport after hydration is hidden to earn
 * the entrance — because a wrapper element between the `<ol>` and its items
 * would cost the list its semantics and the row its snap points.
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
export function PanelTrack({ items, label, header }: PanelTrackProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const walkRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLOListElement>(null)
  const ruleRef = useRef<HTMLSpanElement>(null)
  const [entrance, setEntrance] = useState<'static' | 'armed' | 'entered'>('static')
  const [steerable, setSteerable] = useState(false)

  const sync = useCallback(() => {
    const track = trackRef.current
    const rule = ruleRef.current
    if (!track || !rule) return
    const max = track.scrollWidth - track.clientWidth
    rule.style.setProperty('--track-progress', String(max > 0 ? track.scrollLeft / max : 0))
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
    // `Reveal`'s inversion, column by column: the server ships the columns
    // painted, and only a track still below the viewport after hydration is
    // hidden to earn its entrance. Reduced motion and a track the reader can
    // already see keep the server's paint, untransitioned.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (track.getBoundingClientRect().top < window.innerHeight) return
    setEntrance('armed')
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEntrance('entered')
            io.disconnect()
          }
        }
      },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' },
    )
    io.observe(track)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    const walk = walkRef.current
    const track = trackRef.current
    if (!stage || !walk || !track) return

    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    const finger = window.matchMedia('(pointer: coarse)')
    const allowed = () => !still.matches && !finger.matches

    let frame = 0
    let live = false

    const travel = () => track.scrollWidth - track.clientWidth

    const paint = () => {
      frame = 0
      if (!live) return
      const max = travel()
      if (max <= 0) return
      const rect = walk.getBoundingClientRect()
      // Where the last framing must be settled: the stage's scroll-margin-top
      // resolves the nav-clearance token, so the walk ends where a sticky
      // element would stop — under the pill wherever the pill sits.
      const clearance = parseFloat(getComputedStyle(stage).scrollMarginTop) || WALK_CLEARANCE
      // The walk's window: the stretch of transit in which the rule and every
      // column are on screen. Squeezed under WALK_MIN_SPAN (a tall track in a
      // short viewport), it opens upward from the clearance instead.
      const start = Math.max(
        window.innerHeight - rect.height - WALK_FOOT_GAP,
        clearance + WALK_MIN_SPAN,
      )
      const progress = Math.min(1, Math.max(0, (start - rect.top) / (start - clearance)))
      const delta = progress * max - track.scrollLeft
      // Settled — sub-pixel writes are a scroll event each and move nothing.
      if (Math.abs(delta) <= 0.5) return
      // The track CHASES the target instead of jumping to it: a wheel arrives
      // as discrete steps, and written straight through they read as jerks.
      // The exponential chase turns each step into a glide, and the loop
      // keeps itself alive until the track has caught up.
      track.scrollLeft += delta * DRIVE_EASE
      frame = requestAnimationFrame(paint)
    }

    const schedule = () => {
      if (live && !frame) frame = requestAnimationFrame(paint)
    }

    const take = () => {
      setSteerable(true)
      if (live) return
      live = true
      paint()
    }

    const yieldTrack = () => {
      if (!live) return
      live = false
      if (frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }

    const yieldToSideways = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) yieldTrack()
    }

    const onPreference = () => {
      if (allowed()) {
        take()
        return
      }
      yieldTrack()
      setSteerable(false)
    }

    // Out of sight is where the drive gets its second chance: a reader who
    // took the track over keeps it for as long as the band is on screen.
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (!entry.isIntersecting && allowed()) take()
      },
      { threshold: 0 },
    )
    io.observe(stage)

    if (allowed()) take()

    // The travel moves with the measure; a resize re-aims the chase.
    const resizer = new ResizeObserver(schedule)
    resizer.observe(track)

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    track.addEventListener('pointerdown', yieldTrack)
    track.addEventListener('touchstart', yieldTrack, { passive: true })
    track.addEventListener('keydown', yieldTrack)
    track.addEventListener('focusin', yieldTrack)
    track.addEventListener('wheel', yieldToSideways, { passive: true })
    still.addEventListener('change', onPreference)
    finger.addEventListener('change', onPreference)

    return () => {
      if (frame) cancelAnimationFrame(frame)
      io.disconnect()
      resizer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      track.removeEventListener('pointerdown', yieldTrack)
      track.removeEventListener('touchstart', yieldTrack)
      track.removeEventListener('keydown', yieldTrack)
      track.removeEventListener('focusin', yieldTrack)
      track.removeEventListener('wheel', yieldToSideways)
      still.removeEventListener('change', onPreference)
      finger.removeEventListener('change', onPreference)
    }
  }, [])

  const columns = Math.max(items.length, 1)

  return (
    // The scroll margin is not for scrolling to: it is how the drive reads the
    // resolved nav-clearance token as pixels — `getComputedStyle` hands back
    // an unresolved `calc()` for a custom property, and a resolved length for
    // the real property it lands on.
    <div ref={stageRef} className="w-full scroll-mt-[calc(var(--spacing-nav-offset)+96px)]">
      <div className="flex w-full flex-col gap-[18px]">
        {header}

        <div ref={walkRef} className="flex w-full flex-col">
          {/* Decorative: the `<ol>` under it already carries the count and the
          order, and a scroll position is not something to announce twice. */}
          <div aria-hidden="true" className="bg-line relative h-px w-full overflow-hidden">
            <span
              ref={ruleRef}
              // No transition: the segment follows the finger, and easing it would
              // leave it trailing the columns it reports on.
              className="bg-fg absolute inset-y-0 left-0 block"
              style={{
                width: `${100 / columns}%`,
                // Its own width per column travelled, so a track at rest puts the
                // segment under the first column — what the frame draws — and a
                // track scrolled to the end puts it under the last.
                transform: `translateX(calc(var(--track-progress, 0) * ${(columns - 1) * 100}%))`,
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
            className={cn(
              // The frame's 138px gap over its 1248px content column, held as
              // a fraction so every `lg` viewport keeps the frame's framing —
              // two columns and the third off-canvas — instead of cutting at
              // an arbitrary edge as the column narrows.
              'focus-visible:ring-brand flex gap-6 overflow-x-auto pt-16 [scrollbar-width:none] focus-visible:outline-none focus-visible:ring-2 lg:gap-[11.058%] [&::-webkit-scrollbar]:hidden',
              // The server HTML is the snapping track, which is what a reader with
              // no JavaScript — and the visual-regression harness, which browses
              // with reduced motion — gets.
              steerable ? 'snap-none' : 'snap-x snap-mandatory',
            )}
          >
            {items.map((panel, index) => (
              <li
                key={panel.key}
                data-sanity={panel.dataSanity}
                data-reveal=""
                style={{ transitionDelay: `${ENTRANCE_DELAY + index * ENTRANCE_STAGGER}ms` }}
                className={cn(
                  // The frame's 531px column over its 1248px content column,
                  // a fraction for the same reason as the gap above.
                  'border-line flex w-full shrink-0 snap-start flex-col pb-8 lg:w-[42.548%] lg:border-r lg:pr-16',
                  // Armed off-screen with no transition; the entrance then
                  // fades up on the spring. `translate`, not `transform`:
                  // Tailwind v4 compiles `translate-y-*` to the independent
                  // property (`@o3/ui`'s `motion.ts`), and `translate-none`
                  // rather than `translate-y-0` so a settled column leaves no
                  // containing block behind it.
                  entrance === 'armed' && 'translate-y-6 opacity-0 transition-none',
                  entrance === 'entered' &&
                    'duration-(--duration-reveal) ease-spring translate-none opacity-100 transition-[opacity,translate] motion-reduce:transition-none',
                )}
              >
                <span
                  aria-hidden="true"
                  className="text-fg-subtle pb-1.5 text-[15px] leading-[18px]"
                >
                  {`.${String(index + 1).padStart(2, '0')}`}
                </span>

                {panel.heading ? (
                  // 48/58 at 402 and 64/76 at 1440 — the step the rail header
                  // sets too, so it is shared rather than written twice.
                  <h3 className={cn('font-display text-balance', STATEMENT_STEP)}>
                    {panel.heading}
                  </h3>
                ) : null}

                {/* 24/34 on BOTH frames, so the solved clamp is flat — the one
                step on this band that does not interpolate. */}
                {panel.body ? (
                  <p className="pt-6 text-[24px] leading-[34px]">{panel.body}</p>
                ) : null}

                {panel.note ? (
                  <p className="text-fg-muted pt-6 text-[15px] leading-[22.5px] lg:max-w-[390px]">
                    {panel.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}
