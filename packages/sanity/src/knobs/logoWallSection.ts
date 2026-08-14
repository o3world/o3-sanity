import { defineBlockKnobs } from '@o3/block-spec'
import { surfaceKnob } from './surface'

/**
 * The logo wall's design options — `surface` and nothing else.
 *
 * The band draws one centred row of square tiles that wraps below lg, and the
 * row takes whatever it is given (`1864:2390`, #89). There is no second
 * composition in the frames and no axis an editor picks between, so the only
 * design decision on this band is the colour under it.
 *
 * `bone` because the block asked for it before knobs existed — the warm wash
 * the tiles sit on is what the frame draws.
 */
export const logoWallSectionKnobs = defineBlockKnobs({
  type: 'logoWallSection',
  title: 'Logo wall',
  tier: 'section',
  knobs: [surfaceKnob({ initialValue: 'bone' })],
})
