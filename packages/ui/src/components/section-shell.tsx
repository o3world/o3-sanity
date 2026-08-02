import type { HTMLAttributes } from 'react'
import { cva } from 'class-variance-authority'

import { cn } from '../lib/utils'

/** The three-surface system every section block renders on (docs/specs/schema.md). */
export const SURFACES = ['white', 'bone', 'ink'] as const
export type Surface = (typeof SURFACES)[number]

/**
 * Surface → band classes, exported so a band that has to build its own
 * `<section>` (anything bleeding past the gutter, or painting a gradient
 * behind the container) still resolves the surface the same way this shell
 * does. Text contrast rides on the surface; per-role tones stay the content's
 * job.
 */
export const SURFACE_CLASS: Record<Surface, string> = {
  white: 'bg-white text-fg',
  bone: 'bg-bone text-fg',
  ink: 'bg-ink text-white',
}

/** The container measures the frames use (tokens/layout.css). */
export const SECTION_WIDTH_CLASS = {
  /** 1248px — the 1440 design width less two 96px gutters. The standard shell. */
  section: 'max-w-section',
  /** 1034px — the narrower measure for centred statements (the pull quote). */
  content: 'max-w-content',
  /** No measure — the band's own children decide. */
  full: 'max-w-none',
} as const
export type SectionWidth = keyof typeof SECTION_WIDTH_CLASS

/**
 * The vertical steps the canonical frames use (tokens/layout.css).
 * **Section rhythm is not one value** — the frames hand-tune each band, and
 * the two edges routinely differ (`96px 96px 128px` on partners,
 * `128px 96px 192px` on platforms). So they are separate keys, not one `py`.
 */
const PAD_TOP = {
  none: 'pt-0',
  sm: 'pt-band-sm',
  md: 'pt-band-md',
  lg: 'pt-band-lg',
} as const
const PAD_BOTTOM = {
  none: 'pb-0',
  sm: 'pb-band-sm',
  md: 'pb-band-md',
  lg: 'pb-band-lg',
} as const
export type BandStep = keyof typeof PAD_TOP

const sectionShellVariants = cva(
  // 96px at 1440, 20px at 402 — `--spacing-gutter`, not the prototype's 24px.
  'px-gutter',
  {
    variants: {
      surface: SURFACE_CLASS,
      top: PAD_TOP,
      bottom: PAD_BOTTOM,
    },
    defaultVariants: { surface: 'white', top: 'lg', bottom: 'lg' },
  },
)

export interface SectionShellProps extends HTMLAttributes<HTMLElement> {
  surface?: Surface
  /** Top band step. Defaults to `lg`; a band with a frame should name its own. */
  top?: BandStep
  /** Bottom band step. Defaults to `lg`. */
  bottom?: BandStep
  /** Inner container measure; defaults to the standard 1248px shell. */
  width?: SectionWidth
  /** Extra classes for the inner container (the outer band takes className). */
  contentClassName?: string
}

/**
 * THE section organism: a full-bleed surface band carrying the frames' gutter
 * and vertical rhythm, wrapped around a centred container. Every section block
 * renders inside one — `surface` is a section-block field, not per-page.
 *
 * A band that has to **bleed past the gutter** (the partners logo row, the
 * case-study cards) or paint a **gradient** behind its container builds its own
 * `<section>` and reaches for `SURFACE_CLASS` instead. That is deliberate:
 * teaching this shell every exception would make it the union of all eight
 * bands rather than the shape they share.
 */
export function SectionShell({
  surface,
  top,
  bottom,
  width = 'section',
  className,
  contentClassName,
  children,
  ...rest
}: SectionShellProps) {
  return (
    <section className={cn(sectionShellVariants({ surface, top, bottom }), className)} {...rest}>
      <div className={cn('mx-auto w-full', SECTION_WIDTH_CLASS[width], contentClassName)}>
        {children}
      </div>
    </section>
  )
}

export { sectionShellVariants }
