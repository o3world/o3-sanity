import { Reveal } from '@o3/ui'
import type { DispatchedBlockWrapperProps } from '@o3/content-runtime/blocks'

/**
 * The per-block wrapper both brands hand the dispatch seam: every band fades
 * up 24px as it crosses the viewport edge, once. It stands exactly where the
 * seam's own `<div>` stood, so the band attribution and the jump-link `id`
 * land on the same element they always did.
 *
 * **The hero is the one exclusion.** It plays its own entrance (`MaskedLines`
 * over `Reveal`) and its h1 is the LCP element, so its server HTML has to be
 * painted rather than waiting on hydration to stop being transparent.
 *
 * Every other band is transparent in the server HTML until the observer runs,
 * which is the tradeoff `Reveal` already made in the hero. What makes it safe
 * site-wide is the `noscript` rule each app's root layout carries: with no
 * JavaScript the whole page is visible, unanimated.
 */
export function SectionReveal({ blockType, children, ...rest }: DispatchedBlockWrapperProps) {
  if (blockType === 'heroSection') return <div {...rest}>{children}</div>
  return <Reveal {...rest}>{children}</Reveal>
}
