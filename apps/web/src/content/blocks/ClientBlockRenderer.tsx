'use client'

import dynamic from 'next/dynamic'

// The renderer's own props, not a copy of them: the spread below is not
// excess-property checked, so a second declaration would let a prop added
// there go missing here and typecheck. Type-only, so it adds no import edge
// and the chunk still splits.
import type { OptimisticBlockRendererProps } from './OptimisticBlockRenderer'

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

export function ClientBlockRenderer(props: OptimisticBlockRendererProps) {
  return <OptimisticBlockRenderer {...props} />
}
