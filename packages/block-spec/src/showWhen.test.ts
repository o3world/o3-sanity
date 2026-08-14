import { describe, expect, it } from 'vitest'

import { showWhenSatisfied } from './showWhen'
import type { KnobReader } from './types'

/** A reader over a flat map of block-relative paths — what a consumer supplies. */
const reader =
  (values: Record<string, unknown>): KnobReader =>
  (relPath) =>
    values[relPath]

describe('showWhenSatisfied', () => {
  it('is satisfied when there is no gate at all', () => {
    expect(showWhenSatisfied(undefined, reader({}))).toBe(true)
  })

  describe('present', () => {
    it('shows when the path holds a value', () => {
      const gate = { at: 'media', mode: 'present' } as const
      expect(showWhenSatisfied(gate, reader({ media: { _type: 'figure' } }))).toBe(true)
    })

    it('hides on undefined, null, empty string and empty array', () => {
      const gate = { at: 'media', mode: 'present' } as const
      expect(showWhenSatisfied(gate, reader({}))).toBe(false)
      expect(showWhenSatisfied(gate, reader({ media: null }))).toBe(false)
      expect(showWhenSatisfied(gate, reader({ media: '' }))).toBe(false)
      expect(showWhenSatisfied(gate, reader({ media: [] }))).toBe(false)
    })

    it('counts a declared emptyValue as unset', () => {
      // `decoration: 'none'` is stored, but it means "no decoration" — so a
      // knob that configures the decoration has nothing to configure.
      const gate = { at: 'decoration', mode: 'present', emptyValues: ['none'] } as const
      expect(showWhenSatisfied(gate, reader({ decoration: 'none' }))).toBe(false)
      expect(showWhenSatisfied(gate, reader({ decoration: 'molecule' }))).toBe(true)
    })
  })

  describe('oneOf', () => {
    it('matches a stored value in the list and rejects one outside it', () => {
      const gate = { at: 'variant', mode: 'oneOf', values: ['band'] } as const
      expect(showWhenSatisfied(gate, reader({ variant: 'band' }))).toBe(true)
      expect(showWhenSatisfied(gate, reader({ variant: 'orbital' }))).toBe(false)
    })

    it('treats an unset value as no match by default', () => {
      const gate = { at: 'variant', mode: 'oneOf', values: ['band'] } as const
      expect(showWhenSatisfied(gate, reader({}))).toBe(false)
    })

    it('treats an unset value as a match when emptyMatches is declared', () => {
      // The edge that matters: Sanity does not write `initialValue` into
      // documents saved before the field existed, so a gate on the DEFAULT
      // value sees `undefined` on exactly the documents it should show for.
      const gate = {
        at: 'variant',
        mode: 'oneOf',
        values: ['orbital'],
        emptyMatches: true,
      } as const
      expect(showWhenSatisfied(gate, reader({}))).toBe(true)
      expect(showWhenSatisfied(gate, reader({ variant: 'band' }))).toBe(false)
    })

    it('compares a stored number against its string option', () => {
      const gate = { at: 'columns', mode: 'oneOf', values: ['2', '3'] } as const
      expect(showWhenSatisfied(gate, reader({ columns: 2 }))).toBe(true)
      expect(showWhenSatisfied(gate, reader({ columns: 1 }))).toBe(false)
    })
  })

  describe('notOneOf', () => {
    it('shows for anything outside the list', () => {
      const gate = { at: 'layout', mode: 'notOneOf', values: ['cards'] } as const
      expect(showWhenSatisfied(gate, reader({ layout: 'rail' }))).toBe(true)
      expect(showWhenSatisfied(gate, reader({ layout: 'cards' }))).toBe(false)
    })

    it('shows on an unset value, which is not one of them', () => {
      const gate = { at: 'layout', mode: 'notOneOf', values: ['cards'] } as const
      expect(showWhenSatisfied(gate, reader({}))).toBe(true)
    })
  })

  describe('allOf', () => {
    it('needs every leaf to pass', () => {
      const gate = {
        mode: 'allOf',
        all: [
          { at: 'layout', mode: 'oneOf', values: ['rail'] },
          { at: 'media', mode: 'present' },
        ],
      } as const
      expect(showWhenSatisfied(gate, reader({ layout: 'rail', media: { _type: 'figure' } }))).toBe(
        true,
      )
      expect(showWhenSatisfied(gate, reader({ layout: 'rail' }))).toBe(false)
      expect(showWhenSatisfied(gate, reader({ layout: 'cards', media: {} }))).toBe(false)
    })

    it('is vacuously satisfied when it lists nothing', () => {
      expect(showWhenSatisfied({ mode: 'allOf', all: [] }, reader({}))).toBe(true)
    })
  })
})
