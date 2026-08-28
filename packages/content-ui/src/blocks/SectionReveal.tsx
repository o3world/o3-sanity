import { Reveal } from '@o3/ui'
import type { DispatchedBlockWrapperProps } from '@o3/content-runtime/blocks'

/**
 * The per-block wrapper both brands hand the dispatch seam: every band fades
 * up 24px as it crosses the viewport edge, once. It stands exactly where the
 * seam's own `<div>` stood, so the band attribution and the jump-link `id`
 * land on the same element they always did.
 *
 * **The hero is the one exclusion.** It plays its own entrance (`StaggeredLines`
 * over `Entrance`, both CSS animations), so a second wrapper would duplicate
 * the movement.
 *
 * Every band ships painted in the server HTML — `Reveal` hides one only after
 * hydration, and only while it is still below the viewport — so the first
 * screen never blanks or shifts while the bundle loads.
 */
export function SectionReveal({ blockType, children, ...rest }: DispatchedBlockWrapperProps) {
  if (blockType === 'heroSection') return <div {...rest}>{children}</div>
  return <Reveal {...rest}>{children}</Reveal>
}
