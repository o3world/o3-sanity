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
 * **`molecule` is what the canonical component draws, and `orbs` is still the
 * default.** The `CTA` component set (`2177:1354`) hangs one decoration: the
 * molecule, 775.9px at 15%, centred behind the copy. Every redesigned frame
 * instances it override-free — the Home closer (`2336:4351`) and the partner
 * page's (`2478:2134`) differ only in their words — so `orbs` (`1680:2132`) is
 * a generation behind on every band that draws it.
 *
 * Flipping the default is a four-page repaint and is #163's, not #92's: this
 * list gains the value the partner page needs and nothing else moves, because
 * no seed pins `decoration` and the default is what every existing CTA reads.
 */
export const ctaSectionKnobs = defineBlockKnobs({
  type: 'ctaSection',
  title: 'CTA',
  tier: 'section',
  knobs: [decorationKnob(['orbs', 'molecule', 'none']), surfaceKnob({ initialValue: 'ink' })],
  /**
   * The `button` carries a label and no destination, so it draws as a control
   * until an editor points it somewhere — an inserted band links nowhere by
   * accident. `variant` is left alone deliberately: it is the last design option in
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
