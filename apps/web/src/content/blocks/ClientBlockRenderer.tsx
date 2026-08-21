'use client'

import dynamic from 'next/dynamic'

import type { SanityBlock } from '@o3/sanity/types'

interface ClientBlockRendererProps {
  blocks: SanityBlock[]
  documentId?: string
  documentType?: string
  /** The document array field hosting the blocks. Default `sections`. */
  fieldPath?: string
}

/**
 * The draft-preview renderer, behind a client-side boundary (#269).
 *
 * `Blocks` picks this over the server `BlockRenderer` in draft mode, and it is
 * a server component doing the picking — so importing the renderer itself here
 * would put `useOptimistic`'s comlink machinery in every published page's
 * bundle. `@/sanity/VisualEditing` carries the full reason; the short version
 * is that a `'use client'` module a server component imports is downloaded
 * whether or not it renders, and only a client-side `next/dynamic` splits it.
 *
 * Server-rendered (no `ssr: false`): the preview's first paint has to carry
 * the blocks, the same as the published path.
 */
const OptimisticBlockRenderer = dynamic(() =>
  import('./OptimisticBlockRenderer').then((m) => m.OptimisticBlockRenderer),
)

export function ClientBlockRenderer(props: ClientBlockRendererProps) {
  return <OptimisticBlockRenderer {...props} />
}
