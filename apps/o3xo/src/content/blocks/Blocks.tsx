import { draftMode } from 'next/headers'

import type { SanityBlock } from '@o3/sanity/types'

import { BlockRenderer } from './BlockRenderer'
import { ClientBlockRenderer } from './ClientBlockRenderer'

interface BlocksProps {
  blocks: readonly SanityBlock[]
  documentId?: string
  documentType?: string
  /** The document array field hosting the blocks. Default `sections`. */
  fieldPath?: string
}

/**
 * The single entry point for rendering a section-block array (issue #15).
 *
 * Resolves draft mode itself and picks the right renderer: the server
 * `BlockRenderer` for the published path, `ClientBlockRenderer` (optimistic
 * reorder + Presentation overlays) in draft preview. Views must use this
 * instead of importing either renderer directly — an ESLint boundary
 * enforces it — so a future document view cannot ship a sections array
 * that silently loses the Presentation editing path.
 */
export async function Blocks({ blocks, documentId, documentType, fieldPath }: BlocksProps) {
  const { isEnabled: isDraft } = await draftMode()
  if (isDraft) {
    return (
      <ClientBlockRenderer
        blocks={[...blocks]}
        documentId={documentId}
        documentType={documentType}
        fieldPath={fieldPath}
      />
    )
  }
  return (
    <BlockRenderer
      blocks={blocks}
      documentId={documentId}
      documentType={documentType}
      fieldPath={fieldPath}
    />
  )
}
