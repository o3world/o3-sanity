import { defineItemKnobs, knob } from '@o3/block-spec'
import { defineField } from 'sanity'
import { describe, expect, it } from 'vitest'

import { defineArrayItem } from './defineArrayItem'

/** The member as the tests need to read it — `sanity`'s type keeps most of it opaque. */
type ReadableMember = {
  type: string
  name: string
  title: string
  fields: { name: string; type: string; options?: { list?: unknown } }[]
  preview?: unknown
}

const read = (member: unknown) => member as unknown as ReadableMember

const screenKnobs = defineItemKnobs({
  type: 'screen',
  title: 'Screen',
  knobs: [
    knob({ name: 'tone', title: 'Tone', options: ['ink', 'bone'], initialValue: 'ink' }),
    knob({ name: 'span', title: 'Span', options: ['standard', 'wide'], initialValue: 'standard' }),
  ],
})

const mediaField = defineField({ name: 'media', type: 'string' })

describe('defineArrayItem', () => {
  it('names the member after the spec, so it cannot be filed under another name', () => {
    const member = read(defineArrayItem({ knobs: screenKnobs, fields: [mediaField] }))
    expect(member.type).toBe('object')
    expect(member.name).toBe('screen')
    expect(member.title).toBe('Screen')
  })

  it('places a knob where the author named it, and keeps the field order authored', () => {
    // The order is what typegen publishes. Generating knobs into a fixed slot
    // would move `generated.ts` and the renderer's props with it.
    const member = read(
      defineArrayItem({ knobs: screenKnobs, fields: ['tone', mediaField, 'span'] }),
    )
    expect(member.fields.map((field) => field.name)).toEqual(['tone', 'media', 'span'])
  })

  it('appends a knob nobody placed, after the editorial fields', () => {
    const member = read(defineArrayItem({ knobs: screenKnobs, fields: [mediaField] }))
    expect(member.fields.map((field) => field.name)).toEqual(['media', 'tone', 'span'])
  })

  it('generates the member field from the declaration, options and all', () => {
    const member = read(defineArrayItem({ knobs: screenKnobs, fields: [mediaField] }))
    const tone = member.fields.find((field) => field.name === 'tone')
    expect(tone?.type).toBe('string')
    expect(tone?.options?.list).toEqual([
      { value: 'ink', title: 'Ink' },
      { value: 'bone', title: 'Bone' },
    ])
  })

  it('refuses a knob written again as a hand-written field', () => {
    expect(() =>
      defineArrayItem({
        knobs: screenKnobs,
        fields: [defineField({ name: 'tone', type: 'string' })],
      }),
    ).toThrow(/declared as a knob and written again/)
  })

  it('refuses a placed name the member does not declare', () => {
    expect(() => defineArrayItem({ knobs: screenKnobs, fields: ['tint'] })).toThrow(/tint/)
  })

  it('carries a preview through, and omits the key when there is none', () => {
    const preview = { select: { title: 'media' } }
    expect(
      read(defineArrayItem({ knobs: screenKnobs, fields: [mediaField], preview })).preview,
    ).toEqual(preview)
    expect('preview' in defineArrayItem({ knobs: screenKnobs, fields: [mediaField] })).toBe(false)
  })
})
