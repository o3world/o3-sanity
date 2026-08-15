import { defineBlockKnobs } from '@o3/block-spec'
import { decorationKnob } from './decoration'
import { surfaceKnob } from './surface'
import type { CtaSection } from '../types/generated'

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
  /**
   * The `button` carries a label and no destination, which `ButtonLink` resolves to
   * `/`. `variant` is left alone deliberately: it is the last design option in
   * the repo still on a hand-written field, and giving it a value here would be
   * this ticket quietly answering the shared-object question ADR 0021 left open
   * (map #101's fog, #113).
   */
  placeholder: {
    _type: 'ctaSection',
    heading: 'A heading for this call to action.',
    body: 'Add the line that sits under it.',
    button: { _type: 'button', label: 'Add a link' },
  } satisfies CtaSection,
})
