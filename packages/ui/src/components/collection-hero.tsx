import type { ReactNode } from 'react'

import { cn } from '../lib/utils'
import { Eyebrow } from './eyebrow'
import { SURFACE_CLASS, surfaceAttrs } from './section-shell'
import { SurfaceProvider } from './surface-context'

/**
 * The colours the `Interior Hero` set is drawn on — ink on every route but
 * About, which instances "Interior Hero – White" (`2960:6876`) on **#F5F4F1**.
 * That is the warm off-white, not `#FFFFFF`, and it is `paper` — the light
 * band between white and bone that the set is painted on at both widths.
 */
export type CollectionHeroSurface = 'ink' | 'white' | 'paper' | 'bone'

export interface CollectionHeroProps {
  /**
   * The uppercase kicker — "WORK". Brand red and 16 → 18px at `interior`,
   * flat 16px white at `band`.
   */
  eyebrow?: string | null
  /** The headline. 64px at `interior`; at `band`, 48px flush left and 64px centred. */
  heading: ReactNode
  /**
   * The 24px standfirst. At `band` it is pinned right in a 395px measure; at
   * `interior` it always stacks under the headline. Left-aligned only.
   */
  subheading?: ReactNode
  /**
   * The lockup between the eyebrow and the headline — the partner page sets
   * O3's mark, a ×, and the partner's here (`2479:2205`). Left-aligned only.
   */
  lockup?: ReactNode
  /**
   * THE RIGHT RAIL, and it is optional. The partner page's "O3 EXPERTISE:"
   * list (`2401:3196`) fills it; the base set (`2107:1051`) draws no rail at
   * all and stacks the standfirst under the headline instead.
   *
   * At `band` the rail and the standfirst share one 394px column, so this wins
   * where both are given. At `interior` they no longer compete: the standfirst
   * is always under the headline and this column is the rail's alone.
   */
  aside?: ReactNode
  /**
   * `start` is the Work and About shape — headline left in a 588px measure,
   * subheading pinned right (`1634:1181`, `1924:5344`). `center` is the
   * Solutions shape: eyebrow and headline stacked on the centre line at
   * **60px** in a 650px measure, no subheading (`1925:6141`).
   *
   * The size follows the alignment rather than being its own prop, because
   * that is exactly what the two frames do — there is no centred 48px hero and
   * no left-aligned 60px one.
   */
  align?: 'start' | 'center'
  /**
   * Which generation of the band to draw. `band` is the original Work/Live
   * hero (`1634:1181`) — `ink-warm`, 164px of pill clearance, the two columns
   * centred on each other. `interior` is the 2026-08 `Interior Hero` component
   * (`2107:1051` / `2101:828`), which the redesigned frames instance: 192px of
   * clearance, a 608 copy column, a Light headline over an 18px kicker, an
   * optional rail, and a surface axis.
   *
   * Two values rather than a rewrite because O3XO answers to its own kit and
   * its collection indexes are still canonical at `band`; flipping the default
   * would repaint them against a file that says otherwise. Every O3 caller
   * draws `interior`. Expect these to collapse into one when the o3xo kit
   * grows its own opener — the component-realignment work on #55.
   */
  variant?: 'band' | 'interior'
  /**
   * Which colour the band is painted, at `interior` only — the `band`
   * generation has one drawn colour and ignores this.
   *
   * Defaults to `ink`, which is what every route but About draws.
   */
  surface?: CollectionHeroSurface
  /**
   * THE PICTURE THE BAND SITS ON — a `SectionBackground`, laid full-bleed
   * behind everything the band draws (`2846:4465`).
   *
   * A slot rather than a source, for the reason `SectionShell`'s is: this
   * package knows nothing about Sanity, and a still today is a video later
   * through the same box. The surface still paints under it, so a picture that
   * fails to load leaves the colour the band declared.
   */
  background?: ReactNode
  /** Slot for the band's decoration — About hangs an orbital off the right. */
  decoration?: ReactNode
  className?: string
}

/**
 * The hero band every collection index opens on — built to the Work frame's
 * `1634:1181` (#43).
 *
 * ```
 * 164px 96px 64px, row, space-between, centre, #0F100B
 *   left   gap 16   eyebrow 16px white uppercase | headline 48px in 588px
 *   right           standfirst 24px in 395px
 * ```
 *
 * `#0F100B` is `ink-warm` — the one value in the palette used for exactly this
 * job, the hero band on Work and Live. It is not `ink`, and the difference is
 * visible where the band meets the white grid below it.
 *
 * The 164px top padding is the floating pill's clearance, the same figure the
 * Home hero uses.
 *
 * `variant="interior"` draws the 2026-08 `Interior Hero` set instead
 * (`2107:1051`) — see that prop. It carries the two slots this band did not
 * have: a full-bleed picture under everything, and a right rail that is
 * genuinely optional.
 *
 * Generic and presentational, so it lives in `packages/ui` with a kebab-case
 * filename and takes no schema binding — `/work` and `/insights` both
 * render it, and neither has a document behind its composition.
 */
export function CollectionHero({
  eyebrow,
  heading,
  subheading,
  lockup,
  aside,
  align = 'start',
  variant = 'band',
  surface = 'ink',
  background,
  decoration,
  className,
}: CollectionHeroProps) {
  const centred = align === 'center'
  const interior = variant === 'interior'
  // The `band` generation is drawn on `ink-warm` and on nothing else, so it
  // answers `ink` whatever the caller asked for. Only the redesigned set has a
  // surface axis.
  const painted: CollectionHeroSurface = interior ? surface : 'ink'

  return (
    <SurfaceProvider surface={painted}>
      <section
        {...surfaceAttrs(painted)}
        className={cn(
          'pb-band-sm relative isolate overflow-hidden lg:pb-16',
          // `2101:789`: the Interior Hero's container is 192px 0 64px, on
          // #0A0A0B at every route but About, which draws it white
          // (`2960:6876`). The older band is `ink-warm` at 164px of pill
          // clearance and has no second colour.
          //
          // The redesigned set also draws a TIGHTER MOBILE GUTTER — 16px on
          // all five 402 instances of it against the 20 the older bands on the
          // same frames keep (see `--spacing-gutter-tight`).
          interior
            ? cn(
                SURFACE_CLASS[painted],
                // 192 at the frame = the 64px nav offset + 128; derived so a
                // page with no Utility Nav strip closes the gap with the pill.
                'px-gutter-tight pt-[192px] lg:pt-[calc(var(--spacing-nav-offset)+128px)]',
              )
            : 'px-gutter bg-ink-warm pt-[164px] text-white lg:pt-[calc(var(--spacing-nav-offset)+100px)]',
          className,
        )}
      >
        {background}
        {decoration}
        <div
          className={cn(
            'max-w-section relative mx-auto flex flex-col gap-8',
            centred
              ? 'items-center text-center'
              : 'items-start justify-between lg:flex-row lg:items-center',
            // The redesigned band sits both columns on one baseline instead.
            !centred && interior && 'lg:items-end',
          )}
        >
          <div
            className={cn(
              'flex flex-col gap-4',
              // The copy column is 588 on the older band and 608 on the
              // redesigned set, whose `Left` frame reads 608 in every instance.
              centred ? 'items-center' : interior ? 'lg:w-[608px]' : 'lg:w-[588px]',
              // 24px between the parts where a lockup is one of them
              // (`2401:3185`), against the 16 every other instance sets.
              !centred && lockup && 'gap-6 lg:w-[608px]',
            )}
          >
            {eyebrow ? (
              // The redesigned set steps the kicker to `eyebrow-lg` and draws
              // it BRAND RED on both surfaces — #EB1000 bound to `2457:1854`,
              // read on ink at `I2101:861;2101:791` and on the light band at
              // `I2960:6876;2960:6852`. The older band keeps the white kicker
              // its own frame draws (`1634:1183`).
              <Eyebrow size={interior ? 'lg' : 'base'} tone={interior ? 'brand' : 'inverse'}>
                {eyebrow}
              </Eyebrow>
            ) : null}
            {!centred && lockup ? lockup : null}
            <h1
              className={cn(
                'font-display text-balance',
                centred && 'text-cta max-w-[650px]',
                centred && painted === 'ink' && 'text-on-ink',
                // THE HEADLINE STEPS DOWN WHERE THERE IS A RAIL. `2107:1051`
                // and `2960:6876` draw 64/76 Light at -1px across the whole
                // column; `2401:3185`, which gives the right column to the
                // rail, draws 48/58 Light at 0. Both are read values and the
                // rail is what tells them apart.
                !centred &&
                  (interior
                    ? aside
                      ? 'text-display-xl font-light'
                      : 'text-interior-hero'
                    : 'text-display-xl'),
              )}
            >
              {heading}
            </h1>
            {/*
             * WHERE THE STANDFIRST SITS is what the two generations disagree
             * about. The older band pins it to the right column (`1634:1181`)
             * and moves it under the headline only when the rail has taken
             * that column (`2401:3191`). The redesigned set stacks it under the
             * headline always, which is what makes the rail optional rather
             * than the thing the standfirst is competing with.
             *
             * Its measure narrows to 395 with no rail (`2107:1051`) and fills
             * the 608 column with one (`2401:3185`) — the rail is what the
             * column above it is being read against.
             *
             * Its colour is `#AAA69E` on BOTH surfaces — one variable
             * (`2050:1226`, which the palette names `on-utility`) bound on the
             * ink instance `I2101:861;2846:4458` and the white one
             * `I2960:6876;2960:6854` alike. It is a warm solid rather than
             * `fg-muted`, which inverts to a colder white alpha on ink.
             */}
            {subheading && !centred && (interior || aside) ? (
              <p
                className={cn(
                  'text-lead',
                  interior ? (aside ? undefined : 'lg:w-[395px]') : 'leading-[1.2]',
                  interior && 'text-on-utility',
                )}
              >
                {subheading}
              </p>
            ) : null}
          </div>
          {!centred && aside ? (
            <div className="lg:w-[394px] lg:shrink-0">{aside}</div>
          ) : subheading && !centred && !interior ? (
            <p className="text-lead leading-[1.2] lg:w-[395px]">{subheading}</p>
          ) : null}
        </div>
      </section>
    </SurfaceProvider>
  )
}
