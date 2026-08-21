'use client'

import { useOptimistic } from 'next-sanity/hooks'

import type { SanityBlock } from '@o3/sanity/types'

import { dataAttr, rootFieldLoc } from '@/sanity/dataAttribute'

import { BLOCK_COMPONENTS } from './clientComponents'
import { renderDispatchedBlocks } from './dispatchBlocks'
import { reconcileOptimisticOrder } from './optimisticOrder'

interface OptimisticBlockRendererProps {
  blocks: SanityBlock[]
  documentId?: string
  documentType?: string
  /** The document array field hosting the blocks. Default `sections`. */
  fieldPath?: string
}

// Dev-only fallback for blocks the client registry can't render. Hoisted so
// the JSX isn't reconstructed inside the map on every render; renders
// nothing in production.
function ClientUnknownBlockPlaceholder({
  blockKey,
  blockType,
}: {
  blockKey: string
  blockType: string
}) {
  if (process.env.NODE_ENV !== 'development') return null
  return (
    <div
      key={blockKey}
      className="rounded-card border-line text-fg-muted border border-dashed p-4 text-sm"
    >
      Unknown block type: <code>{blockType}</code>
    </div>
  )
}

/**
 * Client-side block dispatcher — the Presentation Tool draft-preview path.
 * Adds optimistic on-canvas reordering: when an editor drags a block, the
 * overlay pushes the new order here before the mutation round-trips, so the
 * preview reflects the drop instantly.
 *
 * Reached only through `./ClientBlockRenderer`, which loads this module
 * lazily. `useOptimistic` listens to Presentation over comlink, so importing
 * this from a server component puts that machinery in every visitor's bundle;
 * see `@/sanity/VisualEditing` for the mechanism.
 */
export function OptimisticBlockRenderer({
  blocks,
  documentId,
  documentType,
  fieldPath = 'sections',
}: OptimisticBlockRendererProps) {
  // `reconcileOptimisticOrder` re-maps the payload's `_key` ordering back
  // onto the full block data we already hold. A no-op outside a relevant drag.
  // The second generic is the optimistic DOCUMENT shape (the reducer's action
  // wraps it) — the field hosting the blocks varies (sections/story),
  // so it stays a loose record and reconcile picks `fieldPath` off it.
  const orderedBlocks = useOptimistic<SanityBlock[], Record<string, unknown>>(
    blocks,
    (state, action) => reconcileOptimisticOrder(state, action, documentId, fieldPath),
  )

  if (!orderedBlocks?.length) return null

  // The sortable array needs a real container element carrying the
  // array-level `data-sanity` (a fragment can't) — this is what tells
  // Presentation the children form a reorderable array. Each child stamps its
  // own item-level `data-sanity` in the shared dispatch loop. Draft-preview-
  // only: the published path renders through the server `BlockRenderer`
  // fragment, so this wrapper never reaches public HTML.
  const containerAttr =
    documentId && documentType
      ? dataAttr(rootFieldLoc({ id: documentId, type: documentType }, fieldPath))
      : undefined

  return (
    <div data-sanity={containerAttr}>
      {renderDispatchedBlocks({
        blocks: orderedBlocks,
        // Own-property guard mirrors the server renderer's
        // isRegisteredBlockType — a raw index would resolve Object.prototype
        // keys ('constructor', …) to truthy non-components.
        lookup: (type) =>
          Object.prototype.hasOwnProperty.call(BLOCK_COMPONENTS, type)
            ? BLOCK_COMPONENTS[type]
            : undefined,
        Placeholder: ClientUnknownBlockPlaceholder,
        documentId,
        documentType,
        fieldPath,
      })}
    </div>
  )
}
