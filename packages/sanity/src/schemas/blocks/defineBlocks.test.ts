import { defineField } from 'sanity'
import { describe, expect, it } from 'vitest'

import { quoteSectionKnobs } from '../../knobs/quoteSection'
import { defineBaseBlock, defineSectionBlock } from './defineBlocks'

const quote = () => defineField({ name: 'quote', type: 'text' })

describe('block descriptions (ADR 0025)', () => {
  it('a section block carries its description on the schema type', () => {
    const type = defineSectionBlock({
      name: 'quoteSection',
      title: 'Quote',
      description: 'One borrowed voice.',
      knobs: quoteSectionKnobs,
      fields: [quote()],
    })
    expect(type.description).toBe('One borrowed voice.')
  })

  it('a base block carries its description on the schema type', () => {
    const type = defineBaseBlock({
      name: 'richText',
      title: 'Rich text',
      description: 'A column of prose.',
      fields: [quote()],
    })
    expect(type.description).toBe('A column of prose.')
  })

  it('a blank description fails at define time, not in Studio', () => {
    expect(() =>
      defineSectionBlock({
        name: 'quoteSection',
        title: 'Quote',
        description: '   ',
        knobs: quoteSectionKnobs,
        fields: [quote()],
      }),
    ).toThrow(/description/)
  })

  it('a missing description does not compile', () => {
    const missing = () =>
      // @ts-expect-error — description is required (ADR 0025)
      defineSectionBlock({
        name: 'quoteSection',
        title: 'Quote',
        knobs: quoteSectionKnobs,
        fields: [quote()],
      })
    const missingBase = () =>
      // @ts-expect-error — required on the base tier too
      defineBaseBlock({ name: 'richText', title: 'Rich text', fields: [quote()] })
    expect([missing, missingBase]).toHaveLength(2)
  })
})
