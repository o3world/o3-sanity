import { describe, expect, it } from 'vitest'

import { defineBlockKnobs, knob } from './knob'
import { patchableKnobRoots } from './patchableRoots'

const spec = (type: string, names: string[]) =>
  defineBlockKnobs({
    type,
    title: type,
    tier: 'section',
    knobs: names.map((name) => knob({ name, title: name, options: ['a', 'b'] })),
  })

describe('the roots a knob can write', () => {
  it('takes the first segment of every knob path', () => {
    expect(patchableKnobRoots([spec('hero', ['variant', 'media.ratio', 'media.fit'])])).toEqual([
      'media',
      'variant',
    ])
  })

  it('unions every block and sorts, so the value is stable', () => {
    const roots = patchableKnobRoots([
      spec('hero', ['variant', 'surface']),
      spec('rail', ['layout', 'surface']),
    ])
    expect(roots).toEqual(['layout', 'surface', 'variant'])
  })

  it('grows on its own when a block declares a knob on a new root', () => {
    // The whole point: the hand-kept predecessor stayed at four entries while
    // the schema grew three more roots, and nothing failed.
    const before = patchableKnobRoots([spec('hero', ['variant'])])
    const after = patchableKnobRoots([spec('hero', ['variant', 'decoration'])])
    expect(before).not.toContain('decoration')
    expect(after).toContain('decoration')
  })

  it('has nothing to say about a block that declares no knobs', () => {
    expect(patchableKnobRoots([spec('plain', [])])).toEqual([])
    expect(patchableKnobRoots([])).toEqual([])
  })
})
