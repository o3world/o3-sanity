import type { HTMLAttributes } from 'react'
import { cva } from 'class-variance-authority'

import { cn } from '../lib/utils'

/** The three-surface system every section block renders on (docs/specs/schema.md). */
export const SURFACES = ['white', 'bone', 'ink'] as const
export type Surface = (typeof SURFACES)[number]

/** The two prototype container measures (tokens/layout.css). */
export const SECTION_WIDTH_CLASS = {
  /** 1240px — the standard section shell (work, platforms, insights, CTA). */
  section: 'max-w-section',
  /** 1100px — the narrower measure for centered statements (partners, quote). */
  content: 'max-w-content',
} as const
export type SectionWidth = keyof typeof SECTION_WIDTH_CLASS

const sectionShellVariants = cva(
  // Every prototype band: `padding: clamp(120px,14vw,200px) 24px`.
  'px-6 py-section-y',
  {
    variants: {
      surface: {
        white: 'bg-white text-fg',
        bone: 'bg-bone text-fg',
        ink: 'bg-ink text-white',
      },
    },
    defaultVariants: { surface: 'white' },
  },
)

export interface SectionShellProps extends HTMLAttributes<HTMLElement> {
  surface?: Surface
  /** Inner container measure; defaults to the standard 1240px shell. */
  width?: SectionWidth
  /** Extra classes for the inner container (the outer band takes className). */
  contentClassName?: string
}

/**
 * THE section organism: a full-bleed surface band with the shared vertical
 * rhythm and a centered container. Every section block renders inside one —
 * `surface` is a section-block field, not per-page. Text contrast rides on
 * the surface (currentColor downstream); per-role tones (fg-muted vs
 * fg-inverse-muted, brand vs brand-tint) remain the content's job.
 */
export function SectionShell({
  surface,
  width = 'section',
  className,
  contentClassName,
  children,
  ...rest
}: SectionShellProps) {
  return (
    <section className={cn(sectionShellVariants({ surface }), className)} {...rest}>
      <div className={cn('mx-auto', SECTION_WIDTH_CLASS[width], contentClassName)}>{children}</div>
    </section>
  )
}

export { sectionShellVariants }
