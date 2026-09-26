import { defineBlockKnobs, knob } from '@o3/block-spec'
import { decorationKnob } from './decoration'
import { surfaceKnob } from './surface'
import type { QuoteSection } from '../types/generated'

/**
 * The quote band's design options.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 *
 * `molecule` is the 2026-08 case-study quote (`2250:1525`, #97): the same band,
 * with the molecule mark set at 699px and 10% behind the copy instead of the
 * two spheres. A third value on this block's list rather than a second block —
 * the composition is identical.
 */
export const quoteSectionKnobs = defineBlockKnobs({
  type: 'quoteSection',
  title: 'Quote',
  tier: 'section',
  knobs: [
    knob({
      name: 'size',
      title: 'Size',
      description:
        'Default is the large pull quote. Small is the compact quote used on the current homepage.',
      options: ['default', 'small'],
      initialValue: 'default',
      bar: true,
    }),
    decorationKnob(['orbs', 'molecule', 'none']),
    surfaceKnob({ initialValue: 'bone' }),
  ],
  placeholder: {
    _type: 'quoteSection',
    quote: 'Add the quote this band carries.',
    attribution: 'Who said it',
  } satisfies QuoteSection,
})
