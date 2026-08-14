import { defineBlockKnobs } from '@o3/block-spec'
import { surfaceKnob } from './surface'

/**
 * The listing band's design options — `surface` and nothing else.
 *
 * **`pageType` is a closed enum and not a knob**, and this block is where that
 * call costs something, so it is written down twice: here and beside the guard
 * that has to be told (`knobGuard.test.ts`). It names a *content* category —
 * which pages the band lists, via their card fieldset — and the values are
 * `PAGE_TYPES`, a developer-managed list the schema closes rather than a set an
 * editor picks a look from. An editor changing it is choosing what the band is
 * about, not how it looks. CONTEXT.md and ADR 0020 have both said so since the
 * vocabulary existed; #120 is where a converted block finally had to prove it.
 *
 * The band itself draws one grid of cards, so `surface` is the whole roster.
 */
export const listingSectionKnobs = defineBlockKnobs({
  type: 'listingSection',
  title: 'Listing',
  tier: 'section',
  knobs: [surfaceKnob({ initialValue: 'white' })],
})
