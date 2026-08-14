import { defineBlockKnobs } from '@o3/block-spec'
import { decorationKnob } from './decoration'
import { surfaceKnob } from './surface'

/**
 * The CTA band's design options.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 *
 * `orbs | none` and not the quote band's three: the closing band draws the two
 * spheres or nothing behind its heading, and the molecule belongs to the
 * case-study quote it was drawn for.
 */
export const ctaSectionKnobs = defineBlockKnobs({
  type: 'ctaSection',
  title: 'CTA',
  tier: 'section',
  knobs: [decorationKnob(['orbs', 'none']), surfaceKnob({ initialValue: 'ink' })],
})
