import { describe, expect, it } from 'vitest'

import { resolveDecoration } from './decoration'

describe('resolveDecoration', () => {
  it('takes the three values a knob can hold', () => {
    expect(resolveDecoration('molecule')).toBe('molecule')
    expect(resolveDecoration('orbs')).toBe('orbs')
    expect(resolveDecoration('none')).toBe('none')
  })

  it('falls to the orbs every offering block declares first', () => {
    // A document saved before the field existed, and a value no knob lists.
    expect(resolveDecoration(null)).toBe('orbs')
    expect(resolveDecoration(undefined)).toBe('orbs')
    expect(resolveDecoration('sphere')).toBe('orbs')
  })
})
