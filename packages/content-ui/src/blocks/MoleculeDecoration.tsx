import { cn, MoleculeMark } from '@o3/ui'

import { isDarkSurface } from './surface'

import { resolveDecoration } from './decoration'
import type { Surface } from '@o3/sanity/constants'
import type { PageSection } from '@o3/content-runtime/blocks'

export interface MoleculeDecorationProps {
  /** The band's `decoration` knob value, stega and all. */
  decoration: string | null | undefined
  /**
   * The band's Sanity `_type` — what an unset `decoration` is resolved
   * against, since the fallback is that block's declared `initialValue`.
   */
  block: PageSection['_type']
  /** The band's resolved surface — what the glyph's tone is read from. */
  surface: Surface
  /**
   * The per-frame offsets, size and opacity. Everything the frame measured and
   * nothing else: where the glyph hangs, how wide it is, and how far down the
   * band's ink it sits.
   */
  className?: string
  /**
   * The width the glyph is drawn from. `lg` — the default — hides it below the
   * large breakpoint. `base` keeps the decoration visible on mobile frames
   * that include it.
   */
  visibleFrom?: 'lg' | 'base'
}

/**
 * Inert molecule behind a band's copy. The default position is shared by the
 * current proof, Why, and engagement bands; other frames supply their offsets.
 * Surface determines its tone, and the decoration knob controls visibility.
 */
export function MoleculeDecoration({
  decoration,
  block,
  surface,
  className = 'right-[-327px] top-[-536px] w-[980px] opacity-10',
  visibleFrom = 'lg',
}: MoleculeDecorationProps) {
  if (resolveDecoration(decoration, block) !== 'molecule') return null

  return (
    <MoleculeMark
      className={cn(
        'pointer-events-none absolute -z-10',
        visibleFrom === 'lg' && 'hidden lg:block',
        isDarkSurface(surface) ? 'text-white' : 'text-ink',
        className,
      )}
    />
  )
}
