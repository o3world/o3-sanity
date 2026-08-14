import { itemKnobsAt, patchableItemRoots, patchableKnobRoots, visibleKnobs } from '@o3/block-spec'
import { describe, expect, it } from 'vitest'

import { screenGridSectionKnobs, screenKnobs } from './screenGridSection'

/**
 * THE FIRST ITEM-SURFACE KNOBS IN THE REPO (#118).
 *
 * `@o3/block-spec` already pins the mechanism against a fixture spec
 * (`items.test.ts`); what is unpinned is this DECLARATION — that the grid's
 * real options are hung where the canvas looks for them, and that a screen's
 * pick lands on one screen. Both are things ADR 0021 chose and nothing else in
 * `packages/sanity` asserts.
 *
 * The form half is the guard's (`schemas/blocks/knobGuard.test.ts`), which now
 * walks the member root too.
 */

/** Two screens with different tones — the case the block-rooted path could not express. */
const lead = { _key: 'lead', tone: 'brand', span: 'wide' }
const second = { _key: 'second' }

const readFrom = (member: Record<string, unknown>) => (path: string) => member[path]

describe('the screen grid’s knobs', () => {
  it('hangs a screen’s knobs off the array that holds them', () => {
    // The lookup the canvas makes from a hovered tile: block spec, then the
    // array field out of the path it was handed. Never the member's `_type` —
    // `screen` is local to this array, and another block may declare its own.
    expect(itemKnobsAt(screenGridSectionKnobs, 'screens')).toBe(screenKnobs)
    expect(itemKnobsAt(screenGridSectionKnobs, 'screen')).toBeUndefined()
  })

  it('keeps the band’s own roster to the band', () => {
    // Everything an editor turns on this block except the surface belongs to a
    // tile, so the block declares one knob and no path with `[]` in it.
    expect(screenGridSectionKnobs.knobs.map((k) => k.name)).toEqual(['surface'])
    expect(screenGridSectionKnobs.knobs.some((k) => k.name.includes('['))).toBe(false)
  })

  it('delivers both screen options on the item surface', () => {
    const { bySurface } = visibleKnobs({ spec: screenKnobs, read: readFrom(second) })

    expect(bySurface.item.map((r) => r.knob.name)).toEqual(['tone', 'span'])
    expect(bySurface.block).toEqual([])
    expect(bySurface.band).toEqual([])
  })

  it('resolves against the screen it was asked about, not the grid', () => {
    const chosen = visibleKnobs({ spec: screenKnobs, read: readFrom(lead) })
    const untouched = visibleKnobs({ spec: screenKnobs, read: readFrom(second) })

    expect(chosen.all.map((r) => [r.knob.name, r.current.value, r.current.isDefault])).toEqual([
      ['tone', 'brand', false],
      ['span', 'wide', false],
    ])
    // The same knobs, one tile over: unset falls back to the declared default,
    // marked as inherited so the menu draws no check on a value nobody picked.
    expect(untouched.all.map((r) => [r.knob.name, r.current.value, r.current.isDefault])).toEqual([
      ['tone', 'ink', true],
      ['span', 'standard', true],
    ])
  })

  it('gives the optimistic overlay the member fields and never the array', () => {
    // A screen holds a `figure` whose asset the projection dereferences and the
    // echo document does not, so copying `screens` whole would blank every
    // image in the grid on the click (ADR 0021).
    expect(patchableItemRoots(screenGridSectionKnobs)).toEqual({ screens: ['span', 'tone'] })
    expect(patchableKnobRoots([screenGridSectionKnobs])).not.toContain('screens')
  })
})
