import { defineBlockKnobs, knob } from '@o3/block-spec'
import { defineField } from 'sanity'
import { describe, expect, it } from 'vitest'
import { defineSectionBlock } from './defineBlocks'
import { hiddenUnless, knobFields } from './knobFields'

/** A field as the tests need to read it — `hidden` is a callback here. */
type ReadableField = {
  name: string
  type: string
  title?: string
  description?: string
  initialValue?: unknown
  options?: { list?: unknown; layout?: string; direction?: string }
  hidden?: (context: { parent?: unknown }) => boolean
}

const readFields = (block: { fields: unknown }) => block.fields as ReadableField[]

const specOf = (...knobs: ReturnType<typeof knob>[]) =>
  defineBlockKnobs({ type: 'heroSection', title: 'Hero', tier: 'section', knobs })

describe('knobFields', () => {
  it('generates one string field per knob, in declaration order', () => {
    const fields = knobFields(
      specOf(
        knob({ name: 'variant', title: 'Composition', options: ['orbital', 'band'] }),
        knob({ name: 'decoration', title: 'Decoration', options: ['orbs', 'none'] }),
      ),
    ) as unknown as ReadableField[]

    expect(fields.map((field) => [field.name, field.type])).toEqual([
      ['variant', 'string'],
      ['decoration', 'string'],
    ])
  })

  it('carries the declared title, description and initial value onto the field', () => {
    const [field] = knobFields(
      specOf(
        knob({
          name: 'variant',
          title: 'Composition',
          description: 'Orbital is the Home opener.',
          options: ['orbital', 'band'],
          initialValue: 'band',
        }),
      ),
    ) as unknown as ReadableField[]

    expect(field).toMatchObject({
      title: 'Composition',
      description: 'Orbital is the Home opener.',
      initialValue: 'band',
    })
  })

  it('publishes the option set as a titled list, so a value and its label travel together', () => {
    const [field] = knobFields(
      specOf(knob({ name: 'width', title: 'Width', options: ['contained', 'full-bleed'] })),
    ) as unknown as ReadableField[]

    expect(field?.options).toEqual({
      list: [
        { value: 'contained', title: 'Contained' },
        { value: 'full-bleed', title: 'Full bleed' },
      ],
    })
  })

  it('leaves initialValue off a knob that declares none, rather than inventing one', () => {
    const [field] = knobFields(
      specOf(knob({ name: 'variant', title: 'Composition', options: ['orbital', 'band'] })),
    ) as unknown as ReadableField[]

    expect(field && 'initialValue' in field).toBe(false)
  })

  it('generates no hidden callback for an ungated knob', () => {
    const [field] = knobFields(
      specOf(knob({ name: 'variant', title: 'Composition', options: ['orbital', 'band'] })),
    ) as unknown as ReadableField[]

    expect(field?.hidden).toBeUndefined()
  })

  /**
   * The conversion #119 exists for. `layoutSection.columns` is `type: 'number'`
   * holding `1 | 2 | 3`, and typegen publishes that literal union into
   * `LayoutSection`'s props — so a knob declared `valueType: 'number'` has to
   * come out of here as a number field with numeric options, or `generated.ts`
   * moves and the renderer's props change underneath it.
   */
  it('generates a number field with numeric options for a number-valued knob', () => {
    const [field] = knobFields(
      specOf(
        knob({
          name: 'columns',
          title: 'Columns',
          valueType: 'number',
          options: ['1', '2', '3'],
          initialValue: '1',
        }),
      ),
    ) as unknown as ReadableField[]

    expect(field).toMatchObject({ name: 'columns', type: 'number', initialValue: 1 })
    expect(field?.options).toEqual({
      list: [
        { value: 1, title: '1' },
        { value: 2, title: '2' },
        { value: 3, title: '3' },
      ],
    })
  })

  /**
   * The half that makes declaring the type worth more than sniffing it: a knob
   * whose values only LOOK numeric keeps the string field it always had.
   */
  it('leaves a knob that never declared a value type on type: string', () => {
    const [field] = knobFields(
      specOf(knob({ name: 'grade', title: 'Grade', options: ['1', '2'] })),
    ) as unknown as ReadableField[]

    expect(field).toMatchObject({ type: 'string' })
    expect(field?.options).toMatchObject({ list: [{ value: '1' }, { value: '2' }] })
  })

  it('refuses a nested knob path, which has no flat field to generate', () => {
    expect(() =>
      knobFields(
        specOf(knob({ name: 'media.ratio', title: 'Ratio', options: ['wide', 'square'] })),
      ),
    ).toThrow(/nested path/)
  })
})

describe('hiddenUnless', () => {
  const bandOnly = hiddenUnless({ at: 'variant', mode: 'oneOf', values: ['band'] })

  it('shows the field when the gate is satisfied', () => {
    expect(bandOnly({ parent: { variant: 'band' } })).toBe(false)
  })

  it('hides the field when the path holds another value', () => {
    expect(bandOnly({ parent: { variant: 'orbital' } })).toBe(true)
  })

  /**
   * The behaviour the closure it replaces had: `parent?.variant !== 'band'` is
   * true on a document saved before the field existed. A gate naming a value
   * that is not the field's default must not start showing on absence.
   */
  it('hides the field when the path is unset', () => {
    expect(bandOnly({ parent: {} })).toBe(true)
    expect(bandOnly({ parent: undefined })).toBe(true)
  })

  it('reads a dotted path through the parent object', () => {
    const wideOnly = hiddenUnless({ at: 'media.span', mode: 'oneOf', values: ['wide'] })

    expect(wideOnly({ parent: { media: { span: 'wide' } } })).toBe(false)
    expect(wideOnly({ parent: { media: { span: 'standard' } } })).toBe(true)
    expect(wideOnly({ parent: { media: 'not an object' } })).toBe(true)
  })

  it('evaluates every leaf of a compound gate', () => {
    const both = hiddenUnless({
      mode: 'allOf',
      all: [
        { at: 'variant', mode: 'oneOf', values: ['band'] },
        { at: 'eyebrow', mode: 'present' },
      ],
    })

    expect(both({ parent: { variant: 'band', eyebrow: 'WORK' } })).toBe(false)
    expect(both({ parent: { variant: 'band', eyebrow: '' } })).toBe(true)
    expect(both({ parent: { variant: 'orbital', eyebrow: 'WORK' } })).toBe(true)
  })
})

/**
 * `anchor` closes every list below it. It is a plain field the factory appends
 * after the knob splice (#149) — not a design option, so it is not generated
 * from a declaration — and it is spelled out here rather than trimmed off,
 * because what these tests are about is the ORDER a section block's fields come
 * out in: that order is what typegen publishes and what every renderer's props
 * are shaped by.
 */
describe('defineSectionBlock knob placement', () => {
  const knobs = defineBlockKnobs({
    type: 'heroSection',
    title: 'Hero',
    tier: 'section',
    knobs: [
      knob({ name: 'variant', title: 'Composition', options: ['orbital', 'band'] }),
      knob({ name: 'surface', title: 'Surface', options: ['white', 'ink'], initialValue: 'ink' }),
    ],
  })

  it('places a named knob where the field list names it', () => {
    const block = defineSectionBlock({
      name: 'heroSection',
      title: 'Hero',
      description: 'The page’s opening claim.',
      knobs,
      fields: ['variant', defineField({ name: 'eyebrow', type: 'string' })],
    })

    expect(readFields(block).map((field) => field.name)).toEqual([
      'variant',
      'eyebrow',
      'surface',
      'anchor',
    ])
  })

  it('appends a knob the field list never names, so surface keeps its old last place', () => {
    const block = defineSectionBlock({
      name: 'heroSection',
      title: 'Hero',
      description: 'The page’s opening claim.',
      knobs,
      fields: [defineField({ name: 'eyebrow', type: 'string' }), 'variant'],
    })

    expect(readFields(block).map((field) => field.name)).toEqual([
      'eyebrow',
      'variant',
      'surface',
      'anchor',
    ])
  })

  it('refuses a placement that names no knob', () => {
    expect(() =>
      defineSectionBlock({
        name: 'heroSection',
        title: 'Hero',
        description: 'The page’s opening claim.',
        knobs,
        fields: ['layout'],
      }),
    ).toThrow(/places a knob called "layout"/)
  })

  it('refuses a field that restates a knob, rather than emitting it twice', () => {
    expect(() =>
      defineSectionBlock({
        name: 'heroSection',
        title: 'Hero',
        description: 'The page’s opening claim.',
        knobs,
        fields: [defineField({ name: 'variant', type: 'string' })],
      }),
    ).toThrow(/declared as a knob and written again as a field/)
  })

  it('refuses a knob spec with no surface knob — every section block paints a band', () => {
    expect(() =>
      defineSectionBlock({
        name: 'heroSection',
        title: 'Hero',
        description: 'The page’s opening claim.',
        knobs: defineBlockKnobs({
          type: 'heroSection',
          title: 'Hero',
          tier: 'section',
          knobs: [knob({ name: 'variant', title: 'Composition', options: ['orbital'] })],
        }),
        fields: [],
      }),
    ).toThrow(/no surface knob/)
  })

  /**
   * A one-knob block is an ordinary block. Six bands declare nothing but
   * `surface` (#120), and their field has to come out of the same generator as
   * a five-knob block's — which it does, because the shorthand that used to
   * build this spec from a `defaultSurface` string is gone and there is only
   * one path left.
   */
  it('generates the surface field for a block whose whole roster is surface', () => {
    const block = defineSectionBlock({
      name: 'quoteSection',
      title: 'Quote',
      description: 'One borrowed voice.',
      knobs: defineBlockKnobs({
        type: 'quoteSection',
        title: 'Quote',
        tier: 'section',
        knobs: [
          knob({
            name: 'surface',
            title: 'Surface',
            options: ['white', 'bone'],
            initialValue: 'bone',
          }),
        ],
      }),
      fields: [defineField({ name: 'quote', type: 'text' })],
    })
    const fields = readFields(block)

    expect(fields.map((field) => field.name)).toEqual(['quote', 'surface', 'anchor'])
    expect(fields[1]).toMatchObject({ type: 'string', initialValue: 'bone' })
  })
})
