import { defineBlockKnobs } from '@o3/block-spec'
import type { CtaSection } from '../types/generated'

/** Current Combined CTA + Footer (3720:62476) uses a quiet gradient field. */
export const ctaSectionKnobs = defineBlockKnobs({
  type: 'ctaSection',
  title: 'CTA',
  tier: 'section',
  knobs: [],
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
