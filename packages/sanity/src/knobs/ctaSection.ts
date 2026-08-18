import { defineBlockKnobs } from '@o3/block-spec'
import { decorationKnob } from './decoration'
import type { CtaSection } from '../types/generated'

/**
 * The CTA band's design options.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 *
 * **`molecule` is the default, because it is what the canonical component
 * draws.** The `CTA` component set (`2177:1354`) hangs one decoration: the
 * molecule, 775.9px at 15%, centred behind the copy. Every redesigned frame
 * instances it override-free — About (`2124:1120`), Solutions (`2124:1160`),
 * Live (`2124:1084`), Work (`2124:1066`), the insight index (`2336:4351`) and
 * the partner pages differ only in their words.
 *
 * `orbs` (`1680:2132`) stays on the list for the one frame that has not moved:
 * the Home closer, which is still a bespoke band with the sphere and its bleed
 * strip rather than an instance of the component. Its seed pins the value.
 */
export const ctaSectionKnobs = defineBlockKnobs({
  type: 'ctaSection',
  title: 'CTA',
  tier: 'section',
  // Decoration and nothing else. The band's fill is `--color-ink-deep` and
  // structural — the closer is the page's darkest step by design — so there is
  // no `surface` knob to offer. See heroSection for the same reasoning.
  knobs: [decorationKnob(['molecule', 'orbs', 'none'])],
  // `--color-ink-deep`, the page's darkest step, is what the closer IS.
  paintsOwnSurface: 'ink',
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
