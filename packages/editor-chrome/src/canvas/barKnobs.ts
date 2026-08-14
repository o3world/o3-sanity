import { stegaClean } from '@sanity/client/stega'
import { visibleKnobs } from '@o3/block-spec'
import type { BlockKnobs, KnobReader, ResolvedKnob } from '@o3/block-spec'

import { resolveGroqPath } from './groqPath'

/**
 * WHAT THE BAR OFFERS FOR ONE BLOCK — the two pure steps between a draft
 * snapshot and a row of controls.
 *
 * Both live here rather than in the component for the reason ADR 0004 gives:
 * the `unit` project is `.test.ts` only, so anything importing a component is
 * out of its reach. What is left in `CanvasToolbar` is the snapshot, the commit
 * and the pixels.
 */

/**
 * Reads a knob path RELATIVE TO A BLOCK out of the draft snapshot — the
 * `KnobReader` every gate and every value resolution goes through.
 *
 * STEGA-CLEANED ON THE WAY OUT. The mutator's own snapshot is the raw stored
 * document and carries no encoding, so today this changes nothing. It is here
 * because of what the reader is FOR: every value it returns is compared against
 * a declared option string, by `resolveKnobValue` and by every `showWhen` gate.
 * A single invisible character in a stored value makes `'orbital' === 'orbital'`
 * false, and the whole bar then reports "Default" for values an editor did
 * choose while the gates that depend on them quietly close. Cleaning at the one
 * place the values enter costs nothing and removes the class — cleaning at each
 * comparison is the version that gets forgotten once.
 *
 * `stegaClean` is imported from `@sanity/client/stega` and never the
 * `next-sanity` barrel (lint-enforced, ADR 0004).
 */
export function blockKnobReader(snapshot: unknown, blockPath: string): KnobReader {
  return (relPath: string) => stegaClean(resolveGroqPath(snapshot, `${blockPath}.${relPath}`))
}

/**
 * The knobs THE HOVER BAR carries, in the order it renders them.
 *
 * `visibleKnobs` has already answered which knobs apply under this document
 * state — the nesting gate, inherited gates, `showWhen`, and each knob's
 * current value. Two things are left, and neither is a table in the app:
 *
 * - **Which surfaces the bar speaks for.** The bar is docked at the band and
 *   names the block, so it delivers `band` and `block`. `item` knobs belong to
 *   the chip's own menu (#110), because the bar cannot say WHICH item it would
 *   be configuring.
 * - **Which of those ride the bar.** `knob.bar`, and nothing else. The bar is a
 *   curated subset and the menu carries everything (CONTEXT.md → Knobs); that
 *   is a property of the declaration, which is the whole point of ADR 0020. A
 *   roster kept here would be the fifth mirror the ADR exists to delete.
 *
 * Band before block: the band is the larger thing, and it reads outside-in the
 * same way the surfaces nest.
 */
export function barKnobs({
  spec,
  read,
  nested,
}: {
  spec: BlockKnobs
  read: KnobReader
  nested: boolean
}): ResolvedKnob[] {
  const { bySurface } = visibleKnobs({ spec, read, nested })
  return [...bySurface.band, ...bySurface.block].filter((resolved) => resolved.knob.bar)
}
