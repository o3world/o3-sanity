import { patchableItemRoots, patchableKnobRoots } from '@o3/block-spec'
import { BLOCK_KNOBS } from '@o3/sanity/knobs'
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

/**
 * The roots a knob can patch. When the optimistic document carries one (unlike
 * a reorder's `{_key,_type}` stubs) it overlays the rich projected block, so a
 * pick on the canvas toolbar repaints on the click rather than a second later
 * on the mutation refresh. ONLY these roots — adopting arrays raw would clobber
 * the GROQ derefs (`client->`, `caseStudies[]->`, …) the projected block holds.
 *
 * DERIVED FROM THE DECLARATIONS, never listed here. A hand-kept version of this
 * list is what shipped first, and it is the reason `patchableKnobRoots` exists:
 * in the prior art it "stayed at four entries through three toolbar reworks"
 * while the schema grew three more roots, so those knobs patched correctly and
 * then sat there doing nothing visible. Nothing fails when the list falls
 * behind, which is exactly why it does.
 *
 * The day a knob lands on a root the projection RESHAPES — a reference, an
 * array of derefs — it has to be excluded here, because this answers "does the
 * document echo look like the projection" while `patchableKnobRoots` answers
 * "can a patch write it". Every knob root today is a plain string.
 */
const OPTIMISTIC_KNOB_ROOTS = patchableKnobRoots(Object.values(BLOCK_KNOBS))

/**
 * The same job for an ITEM knob (#122), and it cannot be done the same way.
 *
 * The root behind a member's knob is the whole array — `screens` — and a
 * screen holds a `figure` whose asset is a reference. The projection
 * dereferences it; the echo document does not. So the root copy above would
 * trade every resolved image in the grid for a bare `{_ref}` the moment an
 * editor picks a tone, which is the "does the document echo look like the
 * projection" hazard `patchableKnobRoots` documents, landing for the first
 * time.
 *
 * A keyed overlay instead: match members by `_key`, and copy only the fields a
 * member's knobs actually write. Everything else on the member stays projected,
 * so the picture cannot go backwards.
 *
 * Keyed by block type rather than by array name, because an array name is only
 * unique within a block — two blocks may each call theirs `items`.
 */
const OPTIMISTIC_ITEM_ROOTS: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> =
  Object.fromEntries(
    Object.entries(BLOCK_KNOBS)
      .map(([type, spec]) => [type, patchableItemRoots(spec)] as const)
      .filter(([, plan]) => Object.keys(plan).length > 0),
  )

/**
 * The array members the renderer holds, with each knob field the echo moved —
 * or `undefined` when the echo changed none of them, so the caller can keep the
 * projected array by identity.
 *
 * Exported because it is where the rule lives, and because the wiring above it
 * is unreachable until a block declares item knobs (#118).
 */
export function overlayItemKnobs(
  held: unknown,
  echoed: unknown,
  fields: readonly string[],
): unknown[] | undefined {
  if (!Array.isArray(held) || !Array.isArray(echoed)) return undefined
  const byKey = new Map(
    echoed.map((member) => [(member as { _key?: string } | null)?._key, member]),
  )
  let changed = false
  const next = held.map((member) => {
    const echo = byKey.get((member as { _key?: string } | null)?._key) as
      Record<string, unknown> | undefined
    if (!echo || member == null || typeof member !== 'object') return member
    const patch: Record<string, unknown> = {}
    for (const field of fields) {
      if (field in echo && echo[field] !== (member as Record<string, unknown>)[field]) {
        patch[field] = echo[field]
      }
    }
    if (Object.keys(patch).length === 0) return member
    changed = true
    return { ...(member as Record<string, unknown>), ...patch }
  })
  return changed ? next : undefined
}

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
    // The block's own type, off the block the renderer holds — not off the
    // echo, whose stub is the thing being reconciled.
    const itemPlan = OPTIMISTIC_ITEM_ROOTS[rich._type] ?? {}
    for (const [field, fields] of Object.entries(itemPlan)) {
      const merged = overlayItemKnobs(
        (rich as unknown as Record<string, unknown>)[field],
        raw[field],
        fields,
      )
      if (merged) overlay[field] = merged
    }
    return Object.keys(overlay).length > 0 ? ({ ...rich, ...overlay } as SanityBlock) : rich
  })
}
