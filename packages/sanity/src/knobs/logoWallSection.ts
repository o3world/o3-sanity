import { defineBlockKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { LogoWallSection } from '../types/generated'

/**
 * The logo wall's design options.
 *
 * `bone` because the block asked for it before knobs existed — the warm wash
 * the marks sit on is what both frames draw.
 */
export const logoWallSectionKnobs = defineBlockKnobs({
  type: 'logoWallSection',
  title: 'Logo wall',
  tier: 'section',
  knobs: [
    knob({
      name: 'layout',
      title: 'Layout',
      description:
        'Plates is the Home partners band — 280px hairlined squares, six across, clipped at the viewport. Bar is the partner page’s: the same six marks in a short unplated strip, so the row reads as a footnote to the heading rather than as the band’s subject.',
      // `1864:2390`'s 280×280 tiles against `2332:1713`'s 280×100 frames
      // (#92). Same content — one centred row of client marks — in two
      // arrangements, which is a `layout` axis rather than a second block:
      // the call `featureGridSection`, `railPanelsSection` and
      // `inFlightSection` have each already made.
      options: ['plates', 'bar'],
      initialValue: 'plates',
      bar: true,
    }),
    surfaceKnob({ initialValue: 'bone' }),
  ],
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
