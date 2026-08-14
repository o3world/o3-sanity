import { describe, expect, it } from 'vitest'
import { heroSection } from './section'

/**
 * ⚠️ A MIGRATION GUARD, NOT A FIXTURE TO MAINTAIN. **Delete it when #113
 * lands.**
 *
 * `heroSection` is the first block whose design options were moved out of
 * `defineField` and generated from a knob declaration (#105, ADR 0020). The
 * risk of that move is silent: the generator emits a field that is subtly not
 * the one it replaced — a lost `initialValue`, a reordered list, a field that
 * drifted down the form — and nothing fails, because renderers type through
 * `SectionProps<'heroSection'>` and every one of those changes still satisfies
 * it. `pnpm typegen` catches a changed *type*; it says nothing about the shape
 * inside.
 *
 * So this file freezes what the block looked like the day before the
 * conversion, minus the one change that was the point: `eyebrow.hidden` is now
 * generated from a declared `showWhen` instead of a hand-written closure.
 *
 * It exists to make one refactor safe, and its whole value is that nobody
 * updates it. If a real change to the hero makes this fail, the change is
 * right and the file is finished — delete it rather than editing the expected
 * shape. ADR 0001 chose `satisfies` guardrails over schema-parity suites
 * deliberately, and this is the documented exception, not a precedent.
 */

type ReadableField = {
  name: string
  type: string
  initialValue?: unknown
  options?: { list?: { value: string }[] }
  hidden?: (context: { parent?: unknown }) => boolean
}

const fields = heroSection.fields as unknown as ReadableField[]
const fieldNamed = (name: string) => fields.find((field) => field.name === name)

describe('heroSection: the shape it had before its knobs were declared', () => {
  it('has the same fields, of the same types, in the same order', () => {
    expect(fields.map((field) => [field.name, field.type])).toEqual([
      ['variant', 'string'],
      ['eyebrow', 'string'],
      ['headlineLines', 'array'],
      ['subheading', 'text'],
      ['cta', 'cta'],
      ['decoration', 'string'],
      ['surface', 'string'],
    ])
  })

  it('offers the same values, in the same order, with the same defaults', () => {
    const enumOf = (name: string) => ({
      values: fieldNamed(name)?.options?.list?.map((option) => option.value),
      initialValue: fieldNamed(name)?.initialValue,
    })

    expect(enumOf('variant')).toEqual({ values: ['orbital', 'band'], initialValue: 'orbital' })
    expect(enumOf('decoration')).toEqual({ values: ['orbs', 'none'], initialValue: 'orbs' })
    expect(enumOf('surface')).toEqual({
      values: ['white', 'bone', 'ink'],
      initialValue: 'ink',
    })
  })

  /**
   * The intended change, asserted by behaviour rather than by shape: the
   * closure `({parent}) => parent?.variant !== 'band'` is gone, and what
   * replaced it answers identically — including on the unset variant a
   * document saved before #42 still has.
   */
  it('still hides the eyebrow on every variant but the band', () => {
    const hidden = fieldNamed('eyebrow')?.hidden

    expect(hidden?.({ parent: { variant: 'band' } })).toBe(false)
    expect(hidden?.({ parent: { variant: 'orbital' } })).toBe(true)
    expect(hidden?.({ parent: {} })).toBe(true)
  })
})
