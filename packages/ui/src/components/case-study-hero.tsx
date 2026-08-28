import type { ReactNode } from 'react'

import { cn } from '../lib/utils'
import { Eyebrow } from './eyebrow'

export interface CaseStudyHeroProps {
  /** The brand-red uppercase kicker — the client's name ("IRONMAN"). */
  eyebrow?: ReactNode
  /** The case study's title, 64px Light flush left in a 571px measure. */
  heading: ReactNode
  /** The 24px narrative headline, pinned bottom-right in a 395px measure. */
  subheading?: ReactNode
  /**
   * The full-bleed hero photograph. Rendered behind the scrim as the band's
   * background, so pass something that fills its box (`ratio="fill"`).
   */
  media?: ReactNode
  className?: string
}

/**
 * The Case Study detail opener — built to `1710:2301` (desktop) and
 * `1906:923` (mobile), #44.
 *
 * ```
 * 1440 × 819 photograph, cover
 *   scrim   linear-gradient(0deg, #030303 15%, transparent) — 34% on mobile
 *   row     164px 96px 64px, space-between, aligned to the FLOOR
 *     black band behind the whole row at 1440 (`2846:4538`, 1248 × 136)
 *     left  gap 16   eyebrow brand red uppercase | title 64/76 Light in 571
 *     right          narrative headline 24/34 in 395px
 * ```
 *
 * Two things separate it from `CollectionHero`, which is otherwise the same
 * geometry: this band is **photographic** (the collection heroes are a flat
 * `ink-warm` strip), and its two columns sit on the band's floor rather than
 * on its centre line — the scrim only reaches 15% up, so anything higher
 * would sit on open photograph.
 *
 * At 402 the frame stacks the columns, deepens the scrim to 34% and drops the
 * black band (`1906:924` is unfilled) — the same trade `CaseStudyCard` makes:
 * a narrow band has no clear side to keep legible, so the wash has to cover
 * more of it.
 *
 * The 164px top padding is the floating pill's clearance — the same figure
 * the Home and Work heroes use.
 */
export function CaseStudyHero({
  eyebrow,
  heading,
  subheading,
  media,
  className,
}: CaseStudyHeroProps) {
  return (
    <section
      className={cn(
        // 819 fixed at 1440; the 402 frame hugs its content, so the band's
        // height there is the 164px pill clearance plus the copy.
        'px-gutter bg-ink-deep relative isolate flex flex-col justify-end pb-16 pt-[164px] text-white lg:min-h-[819px] lg:pt-[calc(var(--spacing-nav-offset)+100px)]',
        className,
      )}
    >
      <div className="absolute inset-0 -z-20">{media}</div>
      {/*
       * `1710:2302` — ink-deep to transparent, opaque up to 15% of the band.
       * The 402 frame (`1906:923`) runs the same stop to 34% because the copy
       * stacks and reaches higher up the photograph.
       *
       * Two arbitrary gradients rather than one `--gradient-*` token: the two
       * frames differ only in that stop, and a gradient custom property cannot
       * take a stop from the call site. The COLOUR still comes from the token,
       * so the wash is each brand's own darkest ink.
       */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--color-ink-deep)_34%,transparent_100%)] lg:bg-[linear-gradient(0deg,var(--color-ink-deep)_15%,transparent_100%)]" />

      <div className="max-w-section relative mx-auto flex w-full flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
        <div className="flex flex-col justify-center gap-4 lg:w-[571px]">
          {eyebrow ? (
            <Eyebrow size="lg" tone="brand">
              {eyebrow}
            </Eyebrow>
          ) : null}
          <h1 className="text-hero font-display text-balance">{heading}</h1>
        </div>
        {subheading ? <p className="text-lead lg:w-[395px]">{subheading}</p> : null}
      </div>
    </section>
  )
}
