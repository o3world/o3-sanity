import type { HTMLAttributes } from 'react'

import { cn } from '../lib/utils'

export type HalftoneDiscProps = HTMLAttributes<HTMLDivElement>

/**
 * The dotted disc the About frame sets beside a discipline (`1925:5922`, 138px)
 * and beside a job role (`1925:6068`, 70px).
 *
 * **It is a halftone, not an icon.** Both nodes export as a `<mask>` of a
 * tiled circle pattern over a flat black rectangle — there is no glyph in
 * there, and the two sizes carry the **same** pattern rather than a scaled one
 * (both `patternTransform` matrices are `5.76171`). So this is a fixed
 * 5.76px dot grid clipped to a circle, and the call site only picks the
 * diameter. Reading it as a per-discipline icon would have invented four
 * pieces of iconography the frame does not have.
 *
 * Solving the exported pattern: a `viewBox` of 183.7 holding one r=41.75
 * circle, mapped into a 1×1 tile and scaled 5.76171 — dots of **r ≈ 1.31 on a
 * 5.76px grid**. Drawn as a CSS dot grid rather than an SVG pattern so no
 * `<pattern id>` has to be uniquified per instance (ADR 0009 keeps glyphs
 * inline; this is not a glyph).
 *
 * Colour is `currentColor`: the light bands ink it, an ink band would not.
 */
export function HalftoneDisc({ className, ...rest }: HalftoneDiscProps) {
  return (
    <div
      aria-hidden="true"
      className={cn('aspect-square shrink-0 rounded-full', className)}
      style={{
        backgroundImage: 'radial-gradient(currentColor 1.31px, rgba(0, 0, 0, 0) 1.32px)',
        backgroundSize: '5.76px 5.76px',
      }}
      {...rest}
    />
  )
}
