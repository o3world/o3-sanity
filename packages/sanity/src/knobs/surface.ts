import { knob } from '@o3/block-spec'
import type { Knob } from '@o3/block-spec'
import { SURFACES } from '../constants'
import type { Surface } from '../constants'

/**
 * The knob every section block has: which of the three surfaces the band is
 * painted on.
 *
 * It used to be a hardcoded `defineField` appended inside
 * `defineSectionBlock`, which is why it is the first thing ADR 0020 converts —
 * a field sixteen blocks share, that no editorial surface outside the Studio
 * form could see. `surfaceForKnobPath` routes it to the `band` surface, so a
 * nested block drops it: the strip belongs to whatever hosts the block.
 *
 * `initialValue` is required rather than defaulted here, because the old
 * `defaultSurface` argument was required in practice — every block that wanted
 * anything but `white` said so, and a block that silently inherits the wrong
 * band colour is the drift this replaces.
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
