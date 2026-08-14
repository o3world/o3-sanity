'use client'

import type { OverlayComponentResolver } from '@sanity/visual-editing'
import type { BlockKnobs } from '@o3/block-spec'

import { CanvasToolbar } from './CanvasToolbar'
import { canvasSubject } from './subject'

/**
 * THE EXPERIMENTAL SEAM — the whole of our dependency on the `@alpha`
 * overlay-components API, in one function.
 *
 *     <VisualEditing components={createCanvasComponents({ blockKnobs: BLOCK_KNOBS })} />
 *
 * Removing the feature is deleting that prop. Keep it that way: `components`
 * is the only unstable surface the site depends on, and everything it reaches
 * is ours.
 *
 * The adapter is thin on purpose — the decision it makes is `canvasSubject`,
 * which is a pure function of the hovered path and is unit-tested without a
 * browser. What is left here is the shape the library wants.
 *
 * **The resolver is not called everywhere.** On a path the Studio's schema
 * cannot resolve, `ElementOverlay.tsx:286` returns an undefined context and
 * `useCustomComponents` bails before reaching this function — no error, no
 * warning (#104). That is the state inside `layoutSection.items`, a
 * polymorphic array at depth ≥ 2, which is out of scope until #115. Nothing
 * below tries to work around it, because from here there is nothing to work
 * around: we are simply never asked.
 *
 * WHY A FACTORY AND NOT A CONSTANT. The toolbar needs to know what each block
 * type offers, and the declarations are the SITE's (`@o3/sanity/knobs`), not
 * this package's. Taking them as an argument keeps the overlay usable by any
 * Sanity + Next project that declares knobs — the same reason `@o3/block-spec`
 * holds the vocabulary and no instances (ADR 0020). The registry rides on the
 * props rather than being looked up per hover because the resolver does not
 * know the block's `_type`: that comes from the draft snapshot, one level down.
 */
export function createCanvasComponents({
  blockKnobs,
}: {
  blockKnobs: Readonly<Record<string, BlockKnobs>>
}): OverlayComponentResolver {
  return ({ node }) => {
    if (!('path' in node)) return undefined
    const subject = canvasSubject(node.path)
    if (!subject) return undefined
    return { component: CanvasToolbar, props: { ...subject, blockKnobs } }
  }
}
