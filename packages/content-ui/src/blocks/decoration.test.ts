import { describe, expect, it } from 'vitest'

import { resolveDecoration } from './decoration'

describe('resolveDecoration', () => {
  it('takes the three values a knob can hold', () => {
    expect(resolveDecoration('molecule', 'quoteSection')).toBe('molecule')
    expect(resolveDecoration('orbs', 'quoteSection')).toBe('orbs')
    expect(resolveDecoration('none', 'quoteSection')).toBe('none')
  })

  it('falls to the initialValue the block’s own knob declares', () => {
    // A document saved before the field existed, and a value no knob lists.
    expect(resolveDecoration(null, 'quoteSection')).toBe('orbs')
    expect(resolveDecoration(undefined, 'quoteSection')).toBe('orbs')
    expect(resolveDecoration('sphere', 'quoteSection')).toBe('orbs')

    expect(resolveDecoration(null, 'quoteSection')).toBe('orbs')
    expect(resolveDecoration(undefined, 'heroSection')).toBe('orbs')
  })
})
