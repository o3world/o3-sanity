import { defineBlockKnobs } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { FormSection } from '../types/generated'

/**
 * The inquiry form's design options — `surface` and nothing else.
 *
 * **`reasons` is not a knob and is not one waiting to happen.** It is a closed
 * list an editor picks from, which is the shape of a design option and none of
 * its substance: the values are the studio's own taxonomy ("Ventures request",
 * "Labs request"), they change when the business changes, and to any handler
 * receiving a submission they are just strings. An editor editing them is
 * authoring the form, not making a design decision on the canvas — which is the
 * test ADR 0020 leaves to the author, applied here (#120).
 *
 * Nor is the field set. The inputs the block draws are fixed in
 * `FormSection.tsx` because a field set is a contract with whatever receives a
 * submission (ADR 0014), so there is nothing about this band's composition for
 * an editor to turn.
 */
export const formSectionKnobs = defineBlockKnobs({
  type: 'formSection',
  title: 'Form',
  tier: 'section',
  knobs: [surfaceKnob({ initialValue: 'bone' })],
  /**
   * `reasons` needs one option to satisfy `min(1)`, and it is the only field
   * here an editor authors — the inputs are fixed in `FormSection.tsx`.
   * `button` is left out because the renderer already absorbs its absence with
   * the same words the schema's `initialValue` would have written.
   */
  placeholder: {
    _type: 'formSection',
    heading: 'A heading for this form.',
    note: 'Add the line under the heading.',
    reasons: ['General enquiry'],
  } satisfies FormSection,
})
