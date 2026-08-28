import { Reveal } from '@o3/ui'
import { cn } from '@o3/ui/lib/utils'
import type { DispatchedBlockWrapperProps, PageSection } from '@o3/content-runtime/blocks'

import { resolveSurface } from './surface'

/**
 * The band colour under each entrance — `SectionShell`'s fills without its
 * `text-*` pairs, which belong to the band itself.
 */
const SURFACE_GROUND = {
  white: 'bg-white',
  paper: 'bg-paper',
  bone: 'bg-bone',
  ink: 'bg-ink',
} as const

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
 *
 * **The wrapper wears the band's own surface.** The document's ground is ink
 * (each app's `<main>`), so a band fading up over it would rise out of black
 * whatever colour it is. Painted with the band's resolved surface, the ground
 * a hidden band leaves behind is the colour the band arrives in, and the fade
 * only ever brings up the content.
 */
export function SectionReveal({
  blockType,
  block,
  children,
  ...rest
}: DispatchedBlockWrapperProps) {
  if (blockType === 'heroSection') return <div {...rest}>{children}</div>
  const surface = resolveSurface(
    (block as { surface?: string | null }).surface,
    blockType as PageSection['_type'],
  )
  return (
    <Reveal {...rest} className={cn(SURFACE_GROUND[surface], rest.className)}>
      {children}
    </Reveal>
  )
}
