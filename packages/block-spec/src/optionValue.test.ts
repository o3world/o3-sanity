import { describe, expect, it } from 'vitest'

import { knob } from './knob'
import { optionKey, storedValue } from './optionValue'

/**
 * The two legs, tested together and against each other. #123 existed because
 * only the read leg had tests — the write leg was written, shipped, and
 * silently wrong, because nothing downstream of a mutation typechecks.
 */

const columns = knob({
  name: 'columns',
  title: 'Columns',
  options: ['1', '2', '3'],
  initialValue: '1',
  valueType: 'number',
})

const variant = knob({
  name: 'variant',
  title: 'Composition',
  options: ['orbital', 'band'],
  initialValue: 'orbital',
})

describe('optionKey — the read leg', () => {
  it('passes a string through', () => {
    expect(optionKey('band')).toBe('band')
  })

  it('coerces a stored number, because a numeric enum is declared as strings', () => {
    expect(optionKey(2)).toBe('2')
  })

  it('coerces a boolean the same way', () => {
    expect(optionKey(true)).toBe('true')
  })

  it('matches nothing for a shape that would stringify into a collision', () => {
    expect(optionKey({ _type: 'image' })).toBeUndefined()
    expect(optionKey(['a'])).toBeUndefined()
    expect(optionKey(undefined)).toBeUndefined()
  })
})

describe('storedValue — the write leg', () => {
  it('stores a number for a numeric knob, not the option string', () => {
    // The assertion that would have caught #123: a canvas pick on `columns`
    // wrote '2' into a `type: 'number'` field, the renderer coerced it, and
    // the page looked right while the document violated its own schema.
    expect(storedValue(columns, '2')).toBe(2)
    expect(typeof storedValue(columns, '2')).toBe('number')
  })

  it('leaves a string knob alone', () => {
    expect(storedValue(variant, 'band')).toBe('band')
  })

  it('reads the DECLARED type, never the shape of the option string', () => {
    // `'2'` is a plausible number and a plausible version label. Only the
    // declaration knows which, which is why valueType is declared not sniffed.
    const version = knob({ name: 'version', title: 'Version', options: ['1', '2'] })
    expect(storedValue(version, '2')).toBe('2')
    expect(typeof storedValue(version, '2')).toBe('string')
  })
})

describe('the two legs are inverses', () => {
  it.each([columns, variant])('round-trips every option of $name', (spec) => {
    for (const option of spec.options) {
      expect(optionKey(storedValue(spec, option.value))).toBe(option.value)
    }
  })
})
