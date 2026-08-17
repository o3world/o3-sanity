import { knob } from '@o3/block-spec'
import type { Knob } from '@o3/block-spec'
import { SURFACES } from '../constants'
import type { Surface } from '../constants'

/**
 * The knob every section block has: which of the three surfaces the band is
 * painted on.
 *
 * `surfaceForKnobPath` routes it to the `band` surface, so a nested block drops
 * it: the strip belongs to whatever hosts the block.
 *
 * `initialValue` is required rather than defaulted, because it is the answer
 * for two populations at once: a block the form creates, and every document
 * saved before the field existed — the site's `resolveSurface` reads it back
 * as each renderer's fallback. A block that silently inherited a band colour
 * nobody chose is the drift ADR 0020 is about.
 */
export function surfaceKnob({ initialValue }: { initialValue: Surface }): Knob {
  return knob({
    name: 'surface',
    title: 'Surface',
    options: [...SURFACES],
    initialValue,
    // The bar carries a curated subset (CONTEXT.md → Knobs). Surface is the
    // one knob every band offers, so it earns its place there.
    bar: true,
  })
}
