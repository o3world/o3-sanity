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
 * molecule, 775.9px at 15%, centred behind the copy, over the button the set
 * labels "Get in touch". The software-engineering page (`2354:2640`) and the
 * Sanity partner page (`2478:2134`) instance it override-free.
 *
 * `orbs` (`1680:2132`) is the Home closer: a bespoke band with the sphere and
 * its bleed strip rather than an instance of the component. Its seed pins the
 * value, and so does every other seed — the knob's default only reaches a band
 * an editor inserts.
 *
 * **The default stays `molecule` although six page frames now close on a copy
 * of Home's band** — /work `2975:8738`, /about `2975:8826`, /solutions
 * `2975:8839`, /live `2975:8763`, /insights `2975:8788` and the insight detail
 * `2975:8813`. Each is a paste of Home's closer, and its raster (imageRef
 * `51458151…`) is a video capture of our own sphere with a mouse cursor in the
 * pixels — so those frames draw `orbs`, not a photograph, and the set this
 * default is read off has not moved.
 *
 * **A picture is not a decoration.** A closer over a photograph is
 * `backgroundMedia`, the field every section carries, which the renderer lays
 * full-bleed and which silences whatever this knob says (#303).
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
