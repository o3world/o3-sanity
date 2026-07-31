import type { HTMLAttributes, ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '../lib/utils'
import { MaskedLines } from './masked-lines'

const displayHeadingVariants = cva(
  // Each text-display-* / text-hero token bundles size, 1.05–1.3 line-height,
  // negative tracking AND the 300 display weight (tokens/typography.css), so
  // the level class alone reproduces the prototype heading.
  'font-display',
  {
    variants: {
      level: {
        // hero — the homepage h1 ("You see the problem in front of you.").
        hero: 'text-hero',
        // xl — section headlines ("Our Work", "How we work").
        xl: 'text-display-xl',
        // lg — the engagement-model h3s ("Embedded Team Member").
        lg: 'text-display-lg',
        // md — the work-case narrative h3s.
        md: 'text-display-md',
      },
    },
    defaultVariants: { level: 'xl' },
  },
)

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div'

export interface DisplayHeadingProps
  extends HTMLAttributes<HTMLHeadingElement>, VariantProps<typeof displayHeadingVariants> {
  /** Semantic element — the visual size is `level`'s job. */
  as?: HeadingTag
  /**
   * Masked-line reveal variant: pass one node per line and each slides up
   * from behind an overflow mask on mount (the hero headline treatment).
   * Mutually exclusive with `children`.
   */
  lines?: readonly ReactNode[]
  /** ms before the first masked line reveals (only with `lines`). */
  revealDelay?: number
}

/**
 * The Figtree-light display heading in the prototype's four fluid steps.
 * Color follows the surface (inherits currentColor from SectionShell).
 */
export function DisplayHeading({
  as: Tag = 'h2',
  level,
  lines,
  revealDelay,
  className,
  children,
  ...rest
}: DisplayHeadingProps) {
  return (
    <Tag className={cn(displayHeadingVariants({ level }), className)} {...rest}>
      {lines ? <MaskedLines lines={lines} baseDelay={revealDelay} /> : children}
    </Tag>
  )
}

export { displayHeadingVariants }
