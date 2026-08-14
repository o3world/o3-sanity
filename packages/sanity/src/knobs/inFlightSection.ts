import { defineBlockKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'

/**
 * The in-flight band's design options.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 */
export const inFlightSectionKnobs = defineBlockKnobs({
  type: 'inFlightSection',
  title: 'In flight',
  tier: 'section',
  knobs: [
    knob({
      name: 'layout',
      title: 'Layout',
      description:
        'Cards is the studio band — a scrolling row of image cards. Rows is the hairline list: a date or a halftone disc, a kicker, a title, and a link.',
      // The Live frame draws the same three-field entry three times
      // (`1751:1994`, `1710:1800`, `1732:1409`) in two compositions, so this
      // is a layout axis on one block rather than three blocks — the call
      // `disciplineGridSection.layout` and `railPanelsSection.rail` already
      // make (#56, #42). Which lead a row draws is NOT a third enum: an entry
      // with a `date` gets the date column, everything else gets the disc.
      options: ['cards', 'rows'],
      initialValue: 'cards',
    }),
    surfaceKnob({ initialValue: 'white' }),
  ],
})
