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
 * `_key`), so we re-map each optimistic key back to the rich block we already
 * hold. Returns `current` unchanged when the action targets a different
 * document, when we don't know our own document id, or when the payload has no
 * array under `field` — keeping the hook a no-op outside a relevant drag.
 *
 * **A renderer only ever reorders what it holds.** The payload carries the
 * whole field, and since ADR 0018 a field can host members this renderer is
 * not showing: `caseStudy.story` interleaves `chapter` objects with section
 * blocks, and `CaseStudyView` hands each unbroken run of sections to its own
 * dispatcher. Adopting the payload's members wholesale would make every run
 * render every section mid-drag (and draw a placeholder for each chapter), so
 * keys we don't hold are never carried through as stubs.
 *
 * **The contiguity gate.** Dropping the keys we don't hold is only safe while
 * the ones we DO hold still sit together. Take `[ch1, A, B, C, ch2, D]`, which
 * this run reads as `[A, B, C]`: drag `A` past `ch2` to the end and the payload
 * is `[ch1, B, C, ch2, D, A]`. The run still holds `A`, so filtering would
 * render `[B, C, A]` — `A` under the FIRST chapter, in a slot the editor never
 * chose. So the reorder is applied only when this run's keys appear in the
 * payload as one unbroken span (every key present, no foreign member between
 * the first and the last); otherwise the hook returns `current` and the band
 * holds still until the mutation round-trips. A drag across a chapter boundary
 * costs a beat of staleness — a no-op, not a wrong picture.
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

  const held = new Map(current.map((block) => [block._key, block]))
  const members = next as SanityBlock[]

  // Where this run's keys landed in the payload's order.
  const span: number[] = []
  members.forEach((member, index) => {
    if (held.has(member._key)) span.push(index)
  })

  // The contiguity gate — see the note above. Every held key has to be there
  // (a member that vanished is not a reorder), and nothing this run does not
  // hold may sit between the first and the last.
  if (span.length === 0) return current
  if (span.length !== held.size) return current
  if (span[span.length - 1]! - span[0]! !== span.length - 1) return current

  return span.map((index) => {
    const member = members[index]!
    const rich = held.get(member._key)!
    const raw = member as unknown as Record<string, unknown>
    const overlay: Record<string, unknown> = {}
    for (const root of OPTIMISTIC_KNOB_ROOTS) {
      if (root in raw) overlay[root] = raw[root]
    }
    return Object.keys(overlay).length > 0 ? ({ ...rich, ...overlay } as SanityBlock) : rich
  })
}
