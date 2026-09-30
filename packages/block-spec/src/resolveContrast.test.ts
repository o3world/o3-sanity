import { describe, expect, it } from 'vitest'

import { resolveContrast, type BandSurface, type ButtonFill } from './resolveContrast'

/**
 * The whole of Auto, as the table it is (#147, ADR 0026).
 *
 * One row per thing an editor or a document can do: leave the knob alone on
 * each surface, leave it alone nowhere near a band, choose a fill and have it
 * honoured on the band that would have chosen otherwise, and arrive carrying a
 * string the schema stopped offering.
 */
const rows: {
  what: string
  stored: unknown
  surface: BandSurface | undefined
  fill: ButtonFill
}[] = [
  // Auto, on each surface. The light bands take the ink fill; the dark ones
  // take the white one.
  { what: 'auto on white', stored: 'auto', surface: 'white', fill: 'dark' },
  { what: 'auto on bone', stored: 'auto', surface: 'bone', fill: 'dark' },
  { what: 'auto on charcoal', stored: 'auto', surface: 'charcoal', fill: 'light' },
  { what: 'auto on ink', stored: 'auto', surface: 'ink', fill: 'light' },

  // No surface at all: a button outside the band system whose chrome forgot to
  // declare one. Dark, because a light button on an unknown background is the
  // one answer that can be invisible.
  { what: 'auto with no surface', stored: 'auto', surface: undefined, fill: 'dark' },

  // Unset is the same answer as auto — a document saved before the field
  // existed, and the eight seeded instances that never carried a fill.
  { what: 'unset on ink', stored: undefined, surface: 'ink', fill: 'light' },

  // An explicit choice is honoured, including the one the band would not have
  // picked. This is the half that is new: the hero and the CTA band used to
  // overrule it.
  { what: 'dark chosen on ink', stored: 'dark', surface: 'ink', fill: 'dark' },
  { what: 'light chosen on white', stored: 'light', surface: 'white', fill: 'light' },

  // Ghost passes through untouched, and Auto never produces it — the auto
  // rows above, on every surface and none, are the proof of the second half.
  { what: 'ghost on ink', stored: 'ghost', surface: 'ink', fill: 'ghost' },

  // The current brand fill is explicit; the retired inverse spelling stays
  // readable. Inverse is read on white, where Auto would have answered dark.
  { what: 'brand on ink', stored: 'brand', surface: 'ink', fill: 'brand' },
  { what: 'legacy inverse on white', stored: 'inverse', surface: 'white', fill: 'light' },
  // A stored value naming an `Object.prototype` member is still just an
  // unrecognised value, and branch 3 owns it. A bare index would hand back the
  // inherited member as a fill and paint the button with neither.
  { what: 'a prototype member on white', stored: 'toString', surface: 'white', fill: 'dark' },

  // Anything else resolves like Auto rather than like dark, because that is
  // what the knob's control is showing the editor: `resolveKnobValue` falls an
  // unrecognised value back to `initialValue`, and `initialValue` is `auto`.
  { what: 'an off-schema value on ink', stored: 'chartreuse', surface: 'ink', fill: 'light' },
  { what: 'a non-string value', stored: { fill: 'light' }, surface: 'ink', fill: 'light' },
]

describe('resolveContrast', () => {
  it.each(rows)('$what → $fill', ({ stored, surface, fill }) => {
    expect(resolveContrast(stored, surface)).toBe(fill)
  })
})
