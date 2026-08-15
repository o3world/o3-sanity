import { defineBlockKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { InFlightSection } from '../types/generated'

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
      // `featureGridSection.layout` and `railPanelsSection.rail` already
      // make (#56, #42). Which lead a row draws is NOT a third enum: an entry
      // with a `date` gets the date column, everything else gets the disc.
      options: ['cards', 'rows'],
      initialValue: 'cards',
    }),
    surfaceKnob({ initialValue: 'white' }),
  ],
  /**
   * The entry carries no `media` and no `date`, which is a state the band is
   * built for: the rows layout leads with a halftone disc when there is no
   * date, and a card with no image draws the same disc. An empty figure would
   * have been the alternative and it renders nothing.
   */
  placeholder: {
    _type: 'inFlightSection',
    heading: 'A heading for this section.',
    subheading: 'Add the standfirst beside it.',
    entries: [
      { _key: 'first', _type: 'entry', heading: 'An entry title', eyebrow: 'Sector · Focus' },
    ],
  } satisfies InFlightSection,
})
