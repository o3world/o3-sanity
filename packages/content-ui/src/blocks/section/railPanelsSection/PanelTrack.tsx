'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@o3/ui'
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
  /** The band's heading, so the carousel region announces as something. */
  label?: string
  /** The band's server-rendered header row. */
  header?: ReactNode
}

/**
 * What the carousel region announces when the band carries no heading — a
 * real shape, and a focusable stop with no name is worse than a generic one.
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
 * `layout: track` — Home's "How we work" (`2846:5480`, `2975:8355` at 402),
 * on the shared `Carousel` (Embla) primitive.
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
 * is a carousel, and the rule above it is the scroll indicator the frame
 * draws statically — an ink third sitting under the first column. Its length
 * is `1/n` rather than the visible fraction, because the frame's 409/1240 is
 * a third of three panels and not the two-thirds a scrollbar would report: it
 * counts columns. Where it sits is the track's own travel, so it starts under
 * the first column as the frame draws it and finishes under the last — an
 * index would top out one short, because the last column comes into view
 * beside its neighbour rather than alone.
 *
 * **The numeral derives from array order**, the rule `PanelRail`'s `number`
 * mode and `PanelRows` already follow. Both visible columns in the frame read
 * `.03` — the component's default, overridden on neither instance.
 *
 * The fraction lands on the rule as `--track-progress` via Embla's `scroll`
 * event rather than in React state, `ReadingProgress`'s idiom: a `setState`
 * would be a render of the band on every frame of a drag.
 *
 * The carousel root is the keyboard stop: it is focusable, named by the
 * band's heading, and `Carousel` itself turns ArrowLeft/ArrowRight into
 * steps — there is no visible prev/next pair on this band, so the region has
 * to carry the access itself.
 *
 * ## The entrance
 *
 * The columns arrive rather than sit there: opacity and a 24px rise, once, on
 * `--ease-spring` at `--duration-reveal`, each column `ENTRANCE_STAGGER`
 * after the one to its left. It is `Reveal`'s mechanic written onto the
 * columns themselves — the same inversion included: the server ships the
 * columns painted, and only a track still below the viewport after hydration
 * is hidden to earn the entrance.
 *
 * **Spring rather than the house `ease-out`, because of what it composes
 * with.** `SectionReveal` already rises the whole band 24px on `ease-out`,
 * and a second `ease-out` rise inside it is the same motion played twice. A
 * spring leaves the start line at rest, so through the band's own rise the
 * columns travel with it, and they lift only once it has nearly settled.
 *
 * **One reading for the whole track, not one per column.** The observer
 * watches the track; every column then plays on its own delay whether or not
 * it is inside the horizontal fold. The alternative — a column entering as
 * it is scrolled to sideways — would put motion under the finger doing the
 * scrolling, and the rule above the track already answers where you are.
 *
 * ## At 402
 *
 * The same track, one column per view. The frame's column is 424 wide
 * against a 354 content column, so its 64px right padding and its hairline
 * are already off-canvas; below `lg` the column drops both and fills the
 * width instead of carrying a rule nobody sees. Nothing else changes — the
 * mobile frame draws the same four parts at the same steps, with the heading
 * one size down.
 */
export function PanelTrack({ items, label, header }: PanelTrackProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const ruleRef = useRef<HTMLSpanElement>(null)
  const [api, setApi] = useState<CarouselApi>()
  const [entrance, setEntrance] = useState<'static' | 'armed' | 'entered'>('static')

  const sync = useCallback((api: NonNullable<CarouselApi>) => {
    const rule = ruleRef.current
    if (!rule) return
    // Embla reports past the ends during an overscroll drag; the rule stays
    // inside the line.
    const progress = Math.min(1, Math.max(0, api.scrollProgress()))
    rule.style.setProperty('--track-progress', String(progress))
  }, [])

  useEffect(() => {
    if (!api) return
    sync(api)
    api.on('scroll', sync)
    // The travel changes with the measure, and the segment is a fraction of
    // it: without this a resize leaves the rule reporting the old geometry.
    api.on('reInit', sync)
    return () => {
      api.off('scroll', sync)
      api.off('reInit', sync)
    }
  }, [api, sync])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    // `Reveal`'s inversion, column by column: the server ships the columns
    // painted, and only a track still below the viewport after hydration is
    // hidden to earn its entrance. Reduced motion and a track the reader can
    // already see keep the server's paint, untransitioned.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (stage.getBoundingClientRect().top < window.innerHeight) return
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
    io.observe(stage)
    return () => io.disconnect()
  }, [])

  const columns = Math.max(items.length, 1)

  return (
    <div ref={stageRef} className="flex w-full flex-col gap-[18px]">
      {header}

      <div className="flex w-full flex-col">
        {/* Decorative: the carousel under it already carries the count and
        the order, and a scroll position is not something to announce twice. */}
        <div aria-hidden="true" className="bg-line relative h-px w-full overflow-hidden">
          <span
            ref={ruleRef}
            // No transition: the segment follows the finger, and easing it
            // would leave it trailing the columns it reports on.
            className="bg-fg absolute inset-y-0 left-0 block"
            style={{
              width: `${100 / columns}%`,
              // Its own width per column travelled, so a track at rest puts
              // the segment under the first column — what the frame draws —
              // and a track scrolled to the end puts it under the last.
              transform: `translateX(calc(var(--track-progress, 0) * ${(columns - 1) * 100}%))`,
            }}
          />
        </div>

        <Carousel
          setApi={setApi}
          opts={{ align: 'start' }}
          // Focusable because it scrolls and holds nothing focusable of its
          // own: a keyboard reader that cannot reach the region cannot reach
          // the last column at all. `aria-label` is what stops it announcing
          // as an unnamed stop on the way past.
          tabIndex={0}
          aria-label={label ?? UNNAMED}
          className="focus-visible:ring-brand focus-visible:outline-none focus-visible:ring-2"
        >
          <CarouselContent
            // The frame's 138px gap over its 1248px content column, held as
            // a fraction so every `lg` viewport keeps the frame's framing —
            // two columns and the third off-canvas — instead of cutting at
            // an arbitrary edge as the column narrows.
            className="gap-6 pt-16 lg:gap-[11.058%]"
          >
            {items.map((panel, index) => (
              <CarouselItem
                key={panel.key}
                data-sanity={panel.dataSanity}
                data-reveal=""
                style={{ transitionDelay: `${ENTRANCE_DELAY + index * ENTRANCE_STAGGER}ms` }}
                className={cn(
                  // The frame's 531px column over its 1248px content column,
                  // a fraction for the same reason as the gap above.
                  'border-line flex flex-col pb-8 lg:basis-[42.548%] lg:border-r lg:pr-16',
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
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  )
}
