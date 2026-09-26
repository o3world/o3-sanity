import type { ReactNode } from 'react'

import { cn } from '../lib/utils'
import { Eyebrow } from './eyebrow'
import { SURFACE_CLASS, surfaceAttrs } from './section-shell'
import { SurfaceProvider } from './surface-context'

export type CollectionHeroSurface = 'ink' | 'white' | 'paper' | 'bone'

export interface CollectionHeroProps {
  eyebrow?: string | null
  heading: ReactNode
  /** Supporting copy beneath the headline. */
  subheading?: ReactNode
  /** Partner marks between the eyebrow and headline. */
  lockup?: ReactNode
  /** Optional right rail, independent of the standfirst. */
  aside?: ReactNode
  align?: 'start' | 'center'
  surface?: CollectionHeroSurface
  /** Full-bleed media behind the content. */
  background?: ReactNode
  /** App-owned decoration, including the orbital sphere. */
  decoration?: ReactNode
  className?: string
}

/** Current Interior Hero (2107:1051), with the 608px copy lockup (3720:62493). */
export function CollectionHero({
  eyebrow,
  heading,
  subheading,
  lockup,
  aside,
  align = 'start',
  surface = 'ink',
  background,
  decoration,
  className,
}: CollectionHeroProps) {
  const centred = align === 'center'

  return (
    <SurfaceProvider surface={surface}>
      <section
        data-collection-hero="interior"
        {...surfaceAttrs(surface)}
        className={cn(
          'relative isolate overflow-hidden px-4 pb-16 lg:px-24 lg:pt-[240px]',
          centred ? 'pt-48' : 'pt-[208px]',
          SURFACE_CLASS[surface],
          className,
        )}
      >
        {background}
        {decoration}
        <div
          data-route-foreground=""
          className={cn(
            'max-w-section relative mx-auto flex flex-col gap-8',
            centred
              ? 'items-center text-center'
              : 'items-start justify-between lg:flex-row lg:items-end',
          )}
        >
          <div
            className={cn(
              'flex flex-col gap-2',
              centred ? 'w-full max-w-[982px] items-center' : 'lg:w-[608px]',
              !centred && lockup && 'gap-6',
            )}
          >
            {eyebrow ? (
              <Eyebrow
                size="lg"
                tone="inverse"
                className={cn('mb-4', surface !== 'ink' && 'text-brand-deep')}
              >
                {eyebrow}
              </Eyebrow>
            ) : null}
            {!centred && lockup ? lockup : null}
            <h1
              className={cn(
                'font-display text-balance',
                centred && 'text-interior-hero',
                centred && surface === 'ink' && 'text-on-ink',
                !centred && (aside ? 'text-display-xl' : 'text-interior-hero'),
              )}
            >
              {heading}
            </h1>
            {subheading ? (
              <p
                className={cn('text-lead', surface === 'ink' ? 'text-on-utility' : 'text-fg-body')}
              >
                {subheading}
              </p>
            ) : null}
          </div>
          {!centred && aside ? <div className="lg:w-[394px] lg:shrink-0">{aside}</div> : null}
        </div>
      </section>
    </SurfaceProvider>
  )
}
