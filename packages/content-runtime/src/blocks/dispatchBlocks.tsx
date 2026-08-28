import type { ComponentType, HTMLAttributes, ReactNode } from 'react'

import type { SanityBlock } from '@o3/sanity/types'

import { arrayItemLoc, dataAttr } from '../dataAttribute'

import { ANCHOR_OFFSET_CLASS, sectionAnchors } from './anchors'

/**
 * The per-block dispatch loop shared by `BlockRenderer` (server, published)
 * and `ClientBlockRenderer` (Presentation Tool draft preview): look the
 * component up, strip `_type`, stamp the item-level `data-sanity` attr. The
 * two renderers differ only where they genuinely differ: registry source,
 * placeholder component, container element, optimistic ordering.
 *
 * Leaf module (no 'use client', no registry imports) so both bundles can
 * share it without widening either.
 *
 * **The item-level `data-sanity` lands on a wrapper `<div>`, not on
 * `SectionShell`.** `SectionShellProps extends HTMLAttributes<HTMLElement>` and
 * spreads `...rest`, so the shell *could* carry the attribute — but five blocks
 * (`heroSection`, `ctaSection`, `logoWallSection`, `quoteSection`,
 * `screenGridSection`) build their own `<section>` rather than use the shell,
 * because they bleed past the gutter or paint a gradient. Routing band
 * attribution through the shell would attribute eleven blocks and silently skip
 * five. The seam attributes them all identically, and `@o3/ui` keeps knowing
 * nothing about Sanity. The attribute is inert outside the Presentation
 * runtime.
 *
 * The seam also hands each block its own location, so a block can attribute the
 * levels below it — its header, its keyed items — off a path it did not have to
 * build.
 */
/**
 * The per-block wrapper an app supplies. It stands where the plain `<div>`
 * stands — carrying the same `data-sanity`, `id` and `className` — and is told
 * which block it is around, so an app can treat one type differently (the hero
 * owns its own entrance, and its h1 is the LCP element).
 *
 * A component arriving as a parameter is how a brand-free module renders
 * something it may not import.
 */
export interface DispatchedBlockWrapperProps extends HTMLAttributes<HTMLDivElement> {
  blockType: string
  children: ReactNode
}

export function renderDispatchedBlocks(opts: {
  blocks: readonly SanityBlock[]
  /**
   * Registry lookup — returns undefined for unregistered types. Typed
   * `unknown` because the two registries export different (invariant)
   * `ComponentType` unions; the single cast below is the dispatch seam.
   */
  lookup: (type: string) => unknown
  /** Dev-only fallback rendered for unregistered types. */
  Placeholder: ComponentType<{ blockKey: string; blockType: string }>
  documentId?: string
  documentType?: string
  /** The document array field hosting the blocks (`sections` | `story`). */
  fieldPath?: string
  /** Stands in for the per-block `<div>`. Plain `<div>` when absent. */
  BlockWrapper?: ComponentType<DispatchedBlockWrapperProps>
}): ReactNode[] {
  const {
    blocks,
    lookup,
    Placeholder,
    documentId,
    documentType,
    fieldPath = 'sections',
    BlockWrapper,
  } = opts
  // The seam owns the anchor for the same reason it owns band attribution:
  // five blocks build their own `<section>` rather than use the
  // shell, so a jump target routed through the shell would work on eleven
  // bands and silently miss five. Resolved for the array rather than per block
  // because two bands claiming one name is only visible from here (#149).
  const anchors = sectionAnchors(blocks)
  return blocks.map((block) => {
    // The one cast on the dispatch seam: registry values are heterogeneous
    // component types; each block's props are validated where the registry
    // is defined (`satisfies` in registry.ts / clientComponents.ts).
    const Component = lookup(block._type) as ComponentType<Record<string, unknown>> | undefined
    if (!Component) {
      return <Placeholder key={block._key} blockKey={block._key} blockType={block._type} />
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _type, ...props } = block
    const loc =
      documentId && documentType
        ? arrayItemLoc({ id: documentId, type: documentType }, fieldPath, block._key)
        : undefined
    // `loc` is passed AFTER the spread deliberately: a block field of that
    // name would otherwise shadow the location and take the sub-block
    // attribution down with it, silently. `loc` is not in the field lexicon
    // (CONTEXT.md → Naming), so the collision is a rule rather than a hope.
    const rendered = <Component {...props} loc={loc} />
    const anchor = anchors.get(block._key)
    const wrapperProps = {
      ...(loc ? { 'data-sanity': dataAttr(loc) } : {}),
      ...(anchor ? { id: anchor, className: ANCHOR_OFFSET_CLASS } : {}),
    }
    return BlockWrapper ? (
      <BlockWrapper key={block._key} blockType={block._type} {...wrapperProps}>
        {rendered}
      </BlockWrapper>
    ) : (
      <div key={block._key} {...wrapperProps}>
        {rendered}
      </div>
    )
  })
}
