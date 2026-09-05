import type { SanityBlock } from '@o3/sanity/types'

import { renderDispatchedBlocks } from '@o3/content-runtime/blocks'
import { SectionReveal } from '@o3/content-ui'
import { CaseStudySectionReveal, hasCaseStudyMotion } from './caseStudyMotion'
import { BLOCK_REGISTRY, type DispatchedBlockType } from './registry'

interface BlockRendererProps {
  blocks: readonly SanityBlock[]
  documentId?: string
  documentType?: string
  /** The document array field hosting the blocks. Default `sections`. */
  fieldPath?: string
}

function isRegisteredBlockType(value: string): value is DispatchedBlockType {
  return Object.prototype.hasOwnProperty.call(BLOCK_REGISTRY, value)
}

// Dev-only placeholder for unknown block types. Hoisted as a function
// component so the JSX is not reconstructed inside the .map callback on
// every render. Renders nothing in production.
function UnknownBlockPlaceholder({ blockKey, blockType }: { blockKey: string; blockType: string }) {
  if (process.env.NODE_ENV !== 'development') return null
  return (
    <div
      key={blockKey}
      className="rounded-card border-brand text-brand border border-dashed p-4 text-sm"
    >
      Unknown block type: <code>{blockType}</code>
    </div>
  )
}

/** Server-side block dispatcher — the published-page render path. */
export function BlockRenderer({ blocks, documentId, documentType, fieldPath }: BlockRendererProps) {
  if (!blocks?.length) return null

  return (
    <>
      {renderDispatchedBlocks({
        blocks,
        lookup: (type) => (isRegisteredBlockType(type) ? BLOCK_REGISTRY[type] : undefined),
        Placeholder: UnknownBlockPlaceholder,
        documentId,
        documentType,
        fieldPath,
        BlockWrapper: hasCaseStudyMotion(documentId) ? CaseStudySectionReveal : SectionReveal,
      })}
    </>
  )
}
