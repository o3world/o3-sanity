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
        'Plates is the Home partners band: an intro and separator above an unboxed logo strip on a warm light surface. Bar is the compact partner-page strip and supports an authored surface.',
      // Keep the stored layout values; current Home is 3720:60483 / 3726:62792.
      options: ['plates', 'bar'],
      initialValue: 'plates',
      bar: true,
    }),
    surfaceKnob({
      initialValue: 'bone',
      showWhen: { at: 'layout', mode: 'oneOf', values: ['bar'] },
    }),
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
