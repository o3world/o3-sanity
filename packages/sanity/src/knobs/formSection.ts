import { defineBlockKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import { decorationKnob } from './decoration'
import type { FormSection } from '../types/generated'

/** The composition and decoration configure presentation; the input fields remain a submission contract. */
export const formSectionKnobs = defineBlockKnobs({
  type: 'formSection',
  title: 'Form',
  tier: 'section',
  knobs: [
    knob({
      name: 'variant',
      title: 'Composition',
      description:
        'Hero puts the introduction beside the form at the top of a page. Band places a form within a longer page.',
      options: ['band', 'hero'],
      initialValue: 'band',
      bar: true,
    }),
    decorationKnob(['none', 'molecule']),
    surfaceKnob({ initialValue: 'bone' }),
  ],
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
