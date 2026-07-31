import { describe, expect, it } from 'vitest'

import { readTimeMinutes } from './read-time'

function block(text: string) {
  return { _type: 'block', children: [{ _type: 'span', text }] }
}

/**
 * Read time is computed at render rather than stored (schema spec), so it has
 * to survive whatever the migration produces — including bodies that contain
 * non-text blocks like figures and embeds.
 */
describe('readTimeMinutes', () => {
  it('counts words at 200wpm', () => {
    expect(readTimeMinutes([block('word '.repeat(400))])).toBe(2)
  })

  it('never returns less than a minute, even for a near-empty body', () => {
    expect(readTimeMinutes([block('three words here')])).toBe(1)
  })

  it('sums across blocks', () => {
    const body = Array.from({ length: 4 }, () => block('word '.repeat(100)))
    expect(readTimeMinutes(body)).toBe(2)
  })

  it('ignores blocks with no text children, like figures and embeds', () => {
    const body = [
      block('word '.repeat(200)),
      { _type: 'figure', image: {} },
      { _type: 'embed', url: 'https://example.com' },
    ]
    expect(readTimeMinutes(body)).toBe(1)
  })

  it('collapses runs of whitespace instead of counting them as words', () => {
    expect(readTimeMinutes([block('  one   two \n three  ')])).toBe(1)
  })

  it('degrades to 1 for a missing or non-array body rather than throwing', () => {
    expect(readTimeMinutes(null)).toBe(1)
    expect(readTimeMinutes(undefined)).toBe(1)
    expect(readTimeMinutes('not an array')).toBe(1)
  })
})
