import { describe, expect, it } from 'vitest'

import { defineBlockKnobs, knob } from './knob'

describe('knob', () => {
  it('titles a bare string option from its value', () => {
    const k = knob({ name: 'width', title: 'Width', options: ['contained', 'full-bleed'] })
    expect(k.options).toEqual([
      { value: 'contained', title: 'Contained' },
      { value: 'full-bleed', title: 'Full bleed' },
    ])
  })

  it('keeps an authored title and carries previewUrl through', () => {
    const k = knob({
      name: 'variant',
      title: 'Variant',
      options: [{ value: 'band', title: 'The band', previewUrl: '/shots/band.png' }],
    })
    expect(k.options).toEqual([{ value: 'band', title: 'The band', previewUrl: '/shots/band.png' }])
  })

  it('carries an option preview when there is one, and omits the key when there is not', () => {
    const previewed = knob({
      name: 'icon',
      title: 'Icon',
      optionPreview: 'glyph',
      options: ['arrow', 'none'],
    })
    expect(previewed.optionPreview).toBe('glyph')
    expect('optionPreview' in knob({ name: 'icon', title: 'Icon', options: ['arrow'] })).toBe(false)
  })

  it('carries a description when there is one, and omits the key when there is not', () => {
    const described = knob({
      name: 'variant',
      title: 'Composition',
      description: 'Orbital is the Home opener.',
      options: ['orbital', 'band'],
    })
    expect(described.description).toBe('Orbital is the Home opener.')
    expect('description' in knob({ name: 'variant', title: 'Variant', options: ['a'] })).toBe(false)
  })

  it('defaults bar membership to false, because the bar is a curated subset', () => {
    expect(knob({ name: 'variant', title: 'Variant', options: ['a'] }).bar).toBe(false)
    expect(knob({ name: 'variant', title: 'Variant', options: ['a'], bar: true }).bar).toBe(true)
  })

  it('resolves its surface from the prefix table, and lets the author override', () => {
    expect(knob({ name: 'surface', title: 'Surface', options: ['white'] }).surface).toBe('band')
    expect(knob({ name: 'variant', title: 'Variant', options: ['a'] }).surface).toBe('block')
    expect(
      knob({ name: 'variant', title: 'Variant', options: ['a'], surface: 'item' }).surface,
    ).toBe('item')
  })

  /**
   * Declared, never inferred (#119). `['1','2','3']` is the option set of
   * `layoutSection.columns` and it is also the option set a version or a grade
   * would have; only the declaration can tell the schema field's type.
   */
  it('defaults its value type to string, and takes number when declared', () => {
    expect(knob({ name: 'variant', title: 'Variant', options: ['a'] }).valueType).toBe('string')
    expect(knob({ name: 'grade', title: 'Grade', options: ['1', '2'] }).valueType).toBe('string')
    expect(
      knob({ name: 'columns', title: 'Columns', valueType: 'number', options: ['1', '2', '3'] })
        .valueType,
    ).toBe('number')
  })

  /**
   * A number-valued option is stored as a number and compared as a string, so
   * `String(Number(v))` has to give back exactly what was declared. `'01'`
   * would come back `'1'`, match no option, and make the control read
   * "Default" for a value the editor picked.
   */
  it('refuses a number-valued option that does not survive the round trip', () => {
    expect(() =>
      knob({ name: 'columns', title: 'Columns', valueType: 'number', options: ['01', '2'] }),
    ).toThrow(/round trip/)
    expect(() =>
      knob({ name: 'columns', title: 'Columns', valueType: 'number', options: ['one'] }),
    ).toThrow(/round trip/)
  })

  it('refuses an empty option set', () => {
    expect(() => knob({ name: 'variant', title: 'Variant', options: [] })).toThrow(/at least one/)
  })

  it('refuses a duplicate option value', () => {
    expect(() => knob({ name: 'variant', title: 'Variant', options: ['a', 'a'] })).toThrow(
      /duplicate/i,
    )
  })

  it('refuses an initialValue that names no option', () => {
    expect(() =>
      knob({ name: 'variant', title: 'Variant', options: ['a'], initialValue: 'b' }),
    ).toThrow(/initialValue/)
  })
})

describe('defineBlockKnobs', () => {
  it('carries the block identity through untouched', () => {
    const spec = defineBlockKnobs({
      type: 'heroSection',
      title: 'Hero',
      tier: 'section',
      knobs: [knob({ name: 'variant', title: 'Variant', options: ['orbital', 'band'] })],
    })
    expect(spec.type).toBe('heroSection')
    expect(spec.title).toBe('Hero')
    expect(spec.tier).toBe('section')
    expect(spec.knobs.map((k) => k.name)).toEqual(['variant'])
  })

  it('refuses two knobs on the same path', () => {
    expect(() =>
      defineBlockKnobs({
        type: 'heroSection',
        title: 'Hero',
        tier: 'section',
        knobs: [
          knob({ name: 'variant', title: 'Variant', options: ['a'] }),
          knob({ name: 'variant', title: 'Again', options: ['b'] }),
        ],
      }),
    ).toThrow(/variant/)
  })
})
