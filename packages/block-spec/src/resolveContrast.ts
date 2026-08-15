import { optionKey } from './optionValue'

/**
 * The three surfaces a band is painted on, as this package is able to say
 * them. `@o3/sanity/constants` and `@o3/ui`'s section shell each publish the
 * same three literals against their own runtimes; the unions are structurally
 * identical, so passing either one in is a compile-time check that the three
 * lists still agree.
 *
 * **Not `KnobSurface`.** That is the chrome a knob is delivered on
 * (`band | block | item | instance`, `surfaces.ts`); this is paint.
 */
export type BandSurface = 'white' | 'bone' | 'ink'

/** What the presentational button actually draws. `auto` is never one of these. */
export type ButtonFill = 'dark' | 'light' | 'ghost'

/**
 * The readable fill on each surface — the whole of Auto, as a table.
 *
 * Both light surfaces take the ink fill and ink takes the white one, which is
 * the pairing `Button`'s own variants are drawn for: `Theme=Black`
 * (`2134:1786`) on white and bone, `Theme=White` (`2205:1298`) on ink.
 */
const READABLE_ON: Record<BandSurface, ButtonFill> = {
  white: 'dark',
  bone: 'dark',
  ink: 'light',
}

/**
 * The pre-rename enum, mapped rather than dropped. `load` replaces every
 * pipeline-owned document, but a dataset that has not been rebuilt since #42
 * still carries the old strings — and a locked document keeps them forever.
 * `brand` becomes `dark` because the canonical frames have no red button
 * (docs/figma-components.md); `inverse` was already the white fill.
 */
const LEGACY_FILLS: Record<string, ButtonFill> = { brand: 'dark', inverse: 'light' }

/**
 * What a button DRAWS for a stored contrast — the sibling of
 * `resolveKnobValue`, which answers what a *control* displays for one. Both
 * live here so the canvas can show an editor what Auto currently means
 * without a second copy of this table.
 *
 * Four branches, in order:
 *
 * 1. the stored value names a fill → that fill, whatever the band is. An
 *    explicit choice is honoured, which is the half of this that is new;
 * 2. it names a retired fill → the fill that replaced it;
 * 3. `auto`, unset, or anything else → the surface's readable fill;
 * 4. no surface reached this button at all → `dark`, so an unresolved Auto
 *    cannot render white on white and disappear.
 *
 * **Auto never resolves to `ghost`.** Ghost is a deliberate editorial choice —
 * "unfilled here" — and has no automatic case; resolving to it would collapse
 * "readable on this band" and "deliberately bare" into one decision.
 *
 * Branch 3 takes anything unrecognised, not just the literal `auto`, so this
 * agrees with what the editor is looking at: `resolveKnobValue` falls an
 * unknown stored value back to the knob's `initialValue`, and that is `auto`.
 * A control reading *Auto* and a page drawing something else is the
 * disagreement ADR 0020 exists to remove.
 *
 * **`stored` is expected stega-clean.** This package cannot import
 * `@sanity/client/stega` — it has no dependencies and stays that way — so a
 * draft-mode string is cleaned at the call site, one step above.
 */
export function resolveContrast(stored: unknown, surface: BandSurface | undefined): ButtonFill {
  const key = optionKey(stored)

  if (key === 'dark' || key === 'light' || key === 'ghost') return key

  const legacy = key === undefined ? undefined : LEGACY_FILLS[key]
  if (legacy) return legacy

  return surface ? READABLE_ON[surface] : 'dark'
}
