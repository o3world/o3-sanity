import { cn, MoleculeMark } from '@o3/ui'

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
   * large breakpoint, which is where a 699–1300px decoration stops being a
   * decoration and becomes the band. `base` is for a glyph sized in the band's
   * own terms rather than the frame's pixels, which the CTA's is.
   */
  visibleFrom?: 'lg' | 'base'
}

/**
 * The molecule hung behind a band's copy — `ctaSection`, `quoteSection`,
 * `featureGridSection` and `layoutSection`.
 *
 * The seam owns the three things every band needs identically: the **guard**
 * (is this band's knob set to `molecule`?), the **tone**, and the **gate** —
 * inert, behind the copy, and off the small frames.
 *
 * What stays at the call site is what the frames disagree about: the offsets,
 * the width and the opacity, each measured per band. A shared default for them
 * would be a number no frame drew.
 *
 * **Tone is resolved, not declared.** `surface` is the same value the band
 * hands `SectionShell`, so turning the surface knob turns the glyph with it —
 * white on ink, ink on the light surfaces. A band that paints something the
 * three surfaces do not name can still spell its own tone in `className`,
 * which wins.
 */
export function MoleculeDecoration({
  decoration,
  block,
  surface,
  className,
  visibleFrom = 'lg',
}: MoleculeDecorationProps) {
  if (resolveDecoration(decoration, block) !== 'molecule') return null

  return (
    <MoleculeMark
      className={cn(
        'pointer-events-none absolute -z-10',
        visibleFrom === 'lg' && 'hidden lg:block',
        surface === 'ink' ? 'text-white' : 'text-ink',
        className,
      )}
    />
  )
}
