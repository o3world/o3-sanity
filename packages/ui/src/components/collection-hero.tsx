import type { ReactNode } from 'react'

import { cn } from '../lib/utils'
import { Eyebrow } from './eyebrow'
import { SurfaceProvider } from './surface-context'

export interface CollectionHeroProps {
  /** The 16px uppercase kicker — "WORK". */
  eyebrow?: string | null
  /** The headline. 48px flush left, 60px when centred — see `align`. */
  heading: ReactNode
  /** The 24px standfirst pinned right, in a 395px measure. Left-aligned only. */
  subheading?: ReactNode
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
   * (`2107:1051` / `2101:828`), which the redesigned frames instance: `ink`,
   * 192px of clearance, and the two columns sitting on a shared baseline.
   *
   * Two values rather than a rewrite because the older frames have not been
   * redrawn: `/work` and `/live` are still canonical at `band`, and flipping
   * the default would silently repaint two pages against frames that say
   * otherwise. Expect these to collapse into one when those frames land — the
   * component-realignment work on #55.
   */
  variant?: 'band' | 'interior'
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
 * Generic and presentational, so it lives in `packages/ui` with a kebab-case
 * filename and takes no schema binding — `/work` and `/insights` both
 * render it, and neither has a document behind its composition.
 */
export function CollectionHero({
  eyebrow,
  heading,
  subheading,
  align = 'start',
  variant = 'band',
  decoration,
  className,
}: CollectionHeroProps) {
  const centred = align === 'center'
  const interior = variant === 'interior'

  return (
    // Both generations paint a dark band — `ink-warm` at `band`, `ink` at
    // `interior` — so the band declares `ink` either way. The block's own
    // `surface` field never reaches this component and could not change it.
    <SurfaceProvider surface="ink">
      <section
        className={cn(
          'px-gutter pb-band-sm relative isolate overflow-hidden text-white lg:pb-16',
          // `2101:789`: the Interior Hero's container is 192px 0 64px on #0A0A0B.
          interior ? 'bg-ink pt-[192px]' : 'bg-ink-warm pt-[164px]',
          className,
        )}
      >
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
          <div className={cn('flex flex-col gap-4', centred ? 'items-center' : 'lg:w-[588px]')}>
            {eyebrow ? <Eyebrow tone="inverse">{eyebrow}</Eyebrow> : null}
            <h1
              className={cn(
                'font-display text-balance',
                centred ? 'text-cta text-on-ink max-w-[650px]' : 'text-display-xl',
              )}
            >
              {heading}
            </h1>
          </div>
          {subheading && !centred ? (
            <p className="text-lead leading-[1.2] lg:w-[395px]">{subheading}</p>
          ) : null}
        </div>
      </section>
    </SurfaceProvider>
  )
}
