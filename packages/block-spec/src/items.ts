import type { BlockKnobs, ItemKnobs, KnobRoot } from './types'

/**
 * REACHING AN ARRAY MEMBER'S SPEC — through the block that hosts it, and never
 * through a map keyed on the member's `_type` (ADR 0021).
 *
 * A member name is local to its array. `defineArrayMember({type: 'object',
 * name: 'screen'})` registers nothing globally, so two blocks may each declare
 * a `screen` with different fields, and a global map would either collide
 * silently or force an author to rename a member for a reason no schema
 * explains. The host answers instead: a hovered item already knows the block it
 * is in and the array it sits in, so both halves of the key are in the path the
 * overlay was handed.
 */

/**
 * The item spec for one of a block's arrays, or undefined when that array's
 * members declare no knobs.
 *
 * Own-property guarded, because `field` comes from a document path: an array
 * called `constructor` would otherwise resolve to something off
 * `Object.prototype` and hand a function to a caller expecting a spec. Same
 * guard the canvas already keeps on the block registry.
 *
 * Takes any root, and answers `undefined` for the two that host nothing. A
 * caller holding a `KnobRoot` asks the same question whichever one it is, and
 * the alternative is a tier check at each call site that means "does this shape
 * have an `items` key" — which is this function's job.
 */
export function itemKnobsAt(
  spec: KnobRoot | undefined,
  field: string | undefined,
): ItemKnobs | undefined {
  const items = spec && 'items' in spec ? spec.items : undefined
  if (!items || !field) return undefined
  return Object.prototype.hasOwnProperty.call(items, field) ? items[field] : undefined
}

/**
 * THE FIELDS AN ITEM PICK CHANGES, per array, derived from the declarations.
 *
 * The optimistic overlay in the preview needs this and cannot use
 * `patchableKnobRoots`: that answers "which of the BLOCK's roots may I copy
 * from the echo document", and the root behind an item knob is the whole array
 * — whose members hold a `figure` with an asset reference. Copying it raw would
 * swap the projection's dereferenced asset for a bare `{_ref}` and blank every
 * image in the grid on the click, which is a worse picture than a slow one.
 *
 * So the answer is narrower on purpose: the array field, and the exact member
 * fields a knob writes inside it. A consumer overlays those onto the members it
 * already holds, matched by `_key`, and everything else stays projected.
 *
 * Sorted, so the value is stable to compare and to read in a test.
 */
export function patchableItemRoots(spec: BlockKnobs): Readonly<Record<string, readonly string[]>> {
  const plan: Record<string, readonly string[]> = {}
  for (const [field, item] of Object.entries(spec.items ?? {})) {
    const roots = new Set<string>()
    for (const knob of item.knobs) {
      const root = knob.name.split('.')[0]
      if (root) roots.add(root)
    }
    if (roots.size > 0) plan[field] = [...roots].sort()
  }
  return plan
}
