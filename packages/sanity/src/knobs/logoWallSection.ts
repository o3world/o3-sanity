import { defineBlockKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { LogoWallSection } from '../types/generated'

/** Current Home and partner logo bands share the dark ruled composition. */
export const logoWallSectionKnobs = defineBlockKnobs({
  type: 'logoWallSection',
  title: 'Logo wall',
  tier: 'section',
  knobs: [
    knob({
      name: 'layout',
      title: 'Layout',
      description:
        'An intro and separator above an unboxed logo strip. Plates uses the solid Home surface; Bar adds the partner-page texture on ink.',
      // Keep the stored layout values; current Home is 3720:60483 / 3726:62792.
      options: ['plates', 'bar'],
      initialValue: 'plates',
      bar: true,
    }),
    surfaceKnob({
      initialValue: 'ink',
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
