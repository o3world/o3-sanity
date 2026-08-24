import { knob } from '@o3/block-spec'
import type { Knob, ShowWhen } from '@o3/block-spec'
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
 *
 * `options` narrows the roster to the surfaces a band is actually drawn on and
 * `showWhen` gates the control, so a band with a partial surface axis declares
 * it here rather than hand-writing a second `surface` knob beside this one.
 * The hero is the case: it draws ink or white, and only on its interior
 * composition.
 */
export function surfaceKnob({
  initialValue,
  options = SURFACES,
  showWhen,
}: {
  initialValue: Surface
  /** Defaults to all three. Narrow it where the band draws fewer. */
  options?: readonly Surface[]
  /** Gate the control where only one composition of the block offers it. */
  showWhen?: ShowWhen
}): Knob {
  return knob({
    name: 'surface',
    title: 'Surface',
    options: [...options],
    initialValue,
    showWhen,
    // The bar carries a curated subset (CONTEXT.md → Knobs). Surface is the
    // band's own colour, the axis an editor reaches for most, so it earns its
    // place there — and a gated one simply does not draw where it is hidden.
    bar: true,
  })
}
