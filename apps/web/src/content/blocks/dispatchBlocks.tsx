import type { ComponentType, ReactNode } from 'react'

import type { SanityBlock } from '@o3/sanity/types'

import { dataAttr, rootArrayItemLoc } from '@/sanity/dataAttribute'

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
 * The item-level `data-sanity` lands on a wrapper `<div>` rather than inside
 * the block component (vtx stamped it inside SectionShell): `@o3/ui`'s
 * SectionShell contract is `surface` + children only, so the dispatch seam
 * owns visual-editing attribution. The attribute is inert outside the
 * Presentation runtime.
 */
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
  /** The document array field hosting the blocks (`sections` | `extraSections`). */
  fieldPath?: string
}): ReactNode[] {
  const { blocks, lookup, Placeholder, documentId, documentType, fieldPath = 'sections' } = opts
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
    const rendered = <Component {...props} />
    const loc =
      documentId && documentType
        ? rootArrayItemLoc({ id: documentId, type: documentType }, fieldPath, block._key)
        : undefined
    return loc ? (
      <div key={block._key} data-sanity={dataAttr(loc)}>
        {rendered}
      </div>
    ) : (
      <div key={block._key}>{rendered}</div>
    )
  })
}
