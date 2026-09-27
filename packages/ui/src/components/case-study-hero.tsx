import type { ReactNode } from 'react'

import { cn } from '../lib/utils'
import { Eyebrow } from './eyebrow'

export interface CaseStudyHeroProps {
  /** The white uppercase kicker — the client's name ("IRONMAN"). */
  eyebrow?: ReactNode
  /** The case study's title, 48px heading flush left in a 571px measure. */
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

/** Current case-study hero: 3249:20846, with a white eyebrow and 48/58 title. */
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
       * so the wash is the palette's own darkest ink.
       */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(0deg,var(--color-ink-deep)_34%,transparent_100%)] lg:bg-[linear-gradient(0deg,var(--color-ink-deep)_15%,transparent_100%)]" />

      <div
        data-route-foreground=""
        className="max-w-section relative mx-auto flex w-full flex-col items-start justify-between gap-8 lg:flex-row lg:items-end"
      >
        <div className="flex flex-col justify-center gap-4 lg:w-[571px]">
          {eyebrow ? (
            <Eyebrow size="lg" tone="inverse">
              {eyebrow}
            </Eyebrow>
          ) : null}
          <h1 className="text-detail-hero font-display text-balance">{heading}</h1>
        </div>
        {subheading ? <p className="text-lead lg:w-[395px]">{subheading}</p> : null}
      </div>
    </section>
  )
}
