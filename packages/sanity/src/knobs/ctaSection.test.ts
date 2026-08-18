import { describe, expect, it } from 'vitest'

import { ctaSectionKnobs } from './ctaSection'

/**
 * WHICH GENERATION AN INSERTED CTA BAND STARTS ON (#163).
 *
 * `decorationKnob` takes the first option as the initial value, so the order
 * of this one list is the only thing deciding what an editor gets when they
 * drop a CTA band on a page. That makes it a real decision hiding in what
 * looks like a formatting choice — reorder the list for tidiness and every new
 * band silently reverts to the pre-redesign sphere. Nothing else in the repo
 * fails when it does.
 */
describe('the CTA band’s decoration', () => {
  const decoration = ctaSectionKnobs.knobs.find((k) => k.name === 'decoration')

  it('starts on the molecule the canonical `CTA` component hangs', () => {
    expect(decoration?.initialValue).toBe('molecule')
  })

  it('keeps `orbs` on offer for the Home closer, which still draws it', () => {
    expect(decoration?.options.map((option) => option.value)).toEqual(['molecule', 'orbs', 'none'])
  })
})
