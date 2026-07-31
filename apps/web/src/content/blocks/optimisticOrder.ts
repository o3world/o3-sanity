import type { SanityBlock } from '@o3/sanity/types'

// The optimistic-reorder reducer payload. During an on-canvas drag in the
// Presentation Tool, the overlay hands us the mutated document — but its
// section array typically carries only `{_key, _type}` ordering stubs, not
// the full block data. `id`/`originalId` are the draft and published ids of
// the edited document (one of them matches the block list's `documentId`).
export interface OptimisticOrderAction {
  id: string
  originalId?: string
  document?: Record<string, unknown> | null
}

// The plain-JSON style roots a Studio knob can patch. When the optimistic
// document carries them (unlike a reorder's `{_key,_type}` stubs), they
// overlay the rich projected block so the edit shows instantly. ONLY these
// roots — adopting arrays raw would clobber the GROQ derefs (client->,
// caseStudies[]->, …) the projected block holds.
const OPTIMISTIC_KNOB_ROOTS = ['surface', 'layout', 'decoration', 'width'] as const

/**
 * Apply an optimistic reorder to `current` while preserving full block data.
 *
 * The Presentation overlay's payload only encodes the new *order* (by
 * `_key`), so we re-map each optimistic key back to the rich block we
 * already hold; keys absent from `current` fall back to the payload stub
 * rather than dropping out. Returns `current` unchanged when the action
 * targets a different document, when we don't know our own document id, or
 * when the payload has no array under `field` — keeping the hook a no-op
 * outside a relevant drag.
 */
export function reconcileOptimisticOrder(
  current: SanityBlock[],
  action: OptimisticOrderAction,
  documentId: string | undefined,
  field: string,
): SanityBlock[] {
  if (!documentId) return current
  if (action.id !== documentId && action.originalId !== documentId) return current

  const next = action.document?.[field]
  if (!Array.isArray(next)) return current

  return (next as SanityBlock[]).map((b) => {
    const rich = current.find((c) => c._key === b._key)
    if (!rich) return b
    const raw = b as unknown as Record<string, unknown>
    const overlay: Record<string, unknown> = {}
    for (const root of OPTIMISTIC_KNOB_ROOTS) {
      if (root in raw) overlay[root] = raw[root]
    }
    return Object.keys(overlay).length > 0 ? ({ ...rich, ...overlay } as SanityBlock) : rich
  })
}
