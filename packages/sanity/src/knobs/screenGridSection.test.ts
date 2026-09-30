import { itemKnobsAt, patchableItemRoots, patchableKnobRoots } from '@o3/block-spec'
import { describe, expect, it } from 'vitest'

import { screenGridSectionKnobs, screenKnobs } from './screenGridSection'
import { screenGridSection } from '../schemas/blocks/section'

/**
 * THE FIRST ITEM-SURFACE KNOBS IN THE REPO (#118).
 *
 * `@o3/block-spec` already pins the mechanism against a fixture spec
 * (`items.test.ts`); what is unpinned is this DECLARATION — that the grid's
 * real options are hung where the canvas looks for them, and that a screen's
 * pick patches that screen's fields rather than the array. Both are things
 * ADR 0021 chose and nothing else in `packages/sanity` asserts.
 *
 * The form half is the guard's (`schemas/blocks/knobGuard.test.ts`), which now
 * walks the member root too.
 */

describe('the screen grid’s knobs', () => {
  it('hangs a screen’s knobs off the array that holds them', () => {
    // The lookup the canvas makes from a hovered tile: block spec, then the
    // array field out of the path it was handed. Never the member's `_type` —
    // `screen` is local to this array, and another block may declare its own.
    expect(itemKnobsAt(screenGridSectionKnobs, 'screens')).toBe(screenKnobs)
    expect(itemKnobsAt(screenGridSectionKnobs, 'screen')).toBeUndefined()
  })

  it('gives the optimistic overlay the member fields and never the array', () => {
    // A screen holds a `figure` whose asset the projection dereferences and the
    // echo document does not, so copying `screens` whole would blank every
    // image in the grid on the click (ADR 0021).
    expect(patchableItemRoots(screenGridSectionKnobs)).toEqual({
      screens: ['framing', 'span', 'tone'],
    })
    expect(patchableKnobRoots([screenGridSectionKnobs])).not.toContain('screens')
  })

  it('rejects thirds in the feature layout while accepting grid thirds and existing feature spans', () => {
    const field = screenGridSection.fields?.find((field) => field.name === 'screens')
    let validate:
      ((value: unknown, context: { parent: { layout?: string } }) => unknown) | undefined
    const rule = {
      required: () => rule,
      min: () => rule,
      custom: (check: NonNullable<typeof validate>) => {
        validate = check
        return rule
      },
    }
    if (typeof field?.validation !== 'function') throw new Error('Missing screen validation')
    field.validation(rule as never)
    expect(validate?.([{ span: 'third' }], { parent: { layout: 'feature' } })).toBe(
      'Third and two-thirds spans require Grid layout.',
    )
    expect(validate?.([{ span: 'twoThirds' }], { parent: { layout: 'feature' } })).toBe(
      'Third and two-thirds spans require Grid layout.',
    )
    expect(
      validate?.([{ span: 'third' }, { span: 'twoThirds' }], { parent: { layout: 'grid' } }),
    ).toBe(true)
    expect(validate?.([{ span: 'third' }], { parent: {} })).toBe(true)
    expect(
      validate?.([{ span: 'wide' }, { span: 'narrow' }], { parent: { layout: 'feature' } }),
    ).toBe(true)

    // Rows on the six-column grid: a tile that does not fit what is left of a
    // row starts the next one and leaves a hole behind it.
    const grid = { parent: { layout: 'grid' } }
    const spans = (...values: string[]) => values.map((span) => ({ span }))
    expect(validate?.(spans('standard', 'third', 'twoThirds'), grid)).toBe(
      'Tile 3 leaves a gap in the row before it. Rows that use thirds must fill the full width.',
    )
    expect(validate?.(spans('third', 'twoThirds', 'third', 'standard', 'third'), grid)).toBe(
      'Tile 5 leaves a gap in the row before it. Rows that use thirds must fill the full width.',
    )
    expect(validate?.(spans('third', 'twoThirds', 'standard', 'standard', 'wide'), grid)).toBe(true)
    // The last row may stay short, as an odd standard tile always could.
    expect(validate?.(spans('wide', 'third'), grid)).toBe(true)
    // Grids without thirds keep the rules they had.
    expect(validate?.(spans('standard', 'wide'), grid)).toBe(true)
  })
})
