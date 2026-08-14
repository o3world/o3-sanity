import { defineBlockKnobs } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { LogoWallSection } from '../types/generated'

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
  /**
   * `clients` is left empty, and it is the field the band is FOR. A client is a
   * document, and a placeholder may never reference one — it would assert a
   * relationship nobody authored, and it would publish looking authored. The
   * form flags the empty array as required, which is the correct prompt: the
   * one thing an editor has to do here is pick the logos.
   */
  placeholder: {
    _type: 'logoWallSection',
    heading: 'A heading for this logo wall.',
    body: 'Add the line that sits under it.',
  } satisfies LogoWallSection,
})
