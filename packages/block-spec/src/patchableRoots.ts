import type { BlockKnobs } from './types'

/**
 * THE ROOT FIELDS A KNOB CAN WRITE, derived from the declarations themselves.
 *
 * A knob at `media.ratio` writes inside `media`, so `media` is the root that
 * changes when it is picked. The optimistic overlay in the preview needs
 * exactly this set: which fields of a block it may copy from the mutator's
 * local document onto the projected block it is already rendering, so a pick
 * repaints on the click rather than a mutation refresh later.
 *
 * **Derived, never listed.** The prior art kept the same set by hand and it
 * stayed at four entries through three toolbar reworks while the schema grew
 * three more roots — so those knobs patched correctly and then sat there for a
 * second doing nothing visible, which reads as a broken control rather than a
 * slow one. Nothing fails when a hand-kept list falls behind, which is why it
 * falls behind. This walks the same declarations the controls are built from,
 * so the two cannot disagree.
 *
 * Sorted, so the value is stable to compare and to read in a test.
 *
 * WHAT THIS DOES NOT ANSWER: whether the stored value is *shaped* like the
 * projected one. A root holding a reference is stored as `{_ref}` and projected
 * as the dereferenced document, so overlaying it would swap resolved data for a
 * bare ref. Every knob root today is a plain string; the day one is not, the
 * consumer excludes it — this function answers "can a patch write here", and
 * that is a different question from "does the document echo look like the
 * projection".
 */
export function patchableKnobRoots(specs: Iterable<BlockKnobs>): readonly string[] {
  const roots = new Set<string>()
  for (const spec of specs) {
    for (const knob of spec.knobs) {
      const root = knob.name.split('.')[0]
      if (root) roots.add(root)
    }
  }
  return [...roots].sort()
}
