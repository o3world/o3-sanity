import { describe, expect, it } from 'vitest'

import { resolveDecoration } from './decoration'

describe('resolveDecoration', () => {
  it('takes the three values a knob can hold', () => {
    expect(resolveDecoration('molecule', 'ctaSection')).toBe('molecule')
    expect(resolveDecoration('orbs', 'ctaSection')).toBe('orbs')
    expect(resolveDecoration('none', 'ctaSection')).toBe('none')
  })

  /**
   * The fallback is the BLOCK's declared `initialValue`, not one literal
   * (#163). Until the CTA band moved to the molecule every offering block
   * listed `orbs` first, so a single literal and the declaration were the same
   * answer; `ctaSection` is the first block where they part.
   */
  it('falls to the initialValue the block’s own knob declares', () => {
    // A document saved before the field existed, and a value no knob lists.
    expect(resolveDecoration(null, 'ctaSection')).toBe('molecule')
    expect(resolveDecoration(undefined, 'ctaSection')).toBe('molecule')
    expect(resolveDecoration('sphere', 'ctaSection')).toBe('molecule')

    expect(resolveDecoration(null, 'quoteSection')).toBe('orbs')
    expect(resolveDecoration(undefined, 'heroSection')).toBe('orbs')
  })
})
