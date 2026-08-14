import { describe, expect, it } from 'vitest'

import { itemKnobsAt, patchableItemRoots } from './items'
import { defineBlockKnobs, defineItemKnobs, knob } from './knob'
import { visibleKnobs } from './visibleKnobs'

const tone = knob({ name: 'tone', title: 'Tone', options: ['ink', 'bone'], initialValue: 'ink' })
const span = knob({
  name: 'span',
  title: 'Span',
  options: ['standard', 'wide'],
  initialValue: 'standard',
  // A sibling gate at the member's own root, which is the shape the block-root
  // spelling could never express.
  showWhen: { at: 'tone', mode: 'oneOf', values: ['ink'] },
})

const screenKnobs = defineItemKnobs({ type: 'screen', title: 'Screen', knobs: [tone, span] })

const grid = defineBlockKnobs({
  type: 'screenGridSection',
  title: 'Screen grid',
  tier: 'section',
  knobs: [knob({ name: 'surface', title: 'Surface', options: ['white', 'ink'] })],
  items: { screens: screenKnobs },
})

describe('an array member is its own knob root', () => {
  it('stamps the item surface on every knob, whatever the prefix table would say', () => {
    // `tone` and `span` are unlisted paths, so the table answers `block` for
    // both. The spec is what makes them item knobs.
    expect(screenKnobs.knobs.map((k) => k.surface)).toEqual(['item', 'item'])
    expect(tone.surface).toBe('block')
  })

  it('resolves against ONE named member, not one answer for five screens', () => {
    const member = { _key: 'b', tone: 'bone' }
    const { all } = visibleKnobs({ spec: screenKnobs, read: (path) => (member as never)[path] })
    expect(all.map((r) => [r.knob.name, r.current.value, r.surface])).toEqual([
      ['tone', 'bone', 'item'],
    ])
  })

  it('reads a sibling gate at the member root like any other same-root gate', () => {
    const inked = visibleKnobs({ spec: screenKnobs, read: () => 'ink' })
    expect(inked.all.map((r) => r.knob.name)).toEqual(['tone', 'span'])
    expect(inked.bySurface.item).toHaveLength(2)
    expect(inked.bySurface.block).toEqual([])
  })

  it('refuses an item knob declared on a block, where it could only write garbage', () => {
    expect(() =>
      defineBlockKnobs({
        type: 'screenGridSection',
        title: 'Screen grid',
        tier: 'section',
        knobs: [knob({ name: 'screens[].tone', title: 'Tone', options: ['ink'], surface: 'item' })],
      }),
    ).toThrow(/defineItemKnobs/)
  })

  it('refuses a field that is both a knob and an array of knobbed members', () => {
    expect(() =>
      defineBlockKnobs({
        type: 'screenGridSection',
        title: 'Screen grid',
        tier: 'section',
        knobs: [knob({ name: 'screens', title: 'Screens', options: ['a'] })],
        items: { screens: screenKnobs },
      }),
    ).toThrow(/design option/)
  })

  it('refuses two knobs on the same member path', () => {
    expect(() =>
      defineItemKnobs({
        type: 'screen',
        title: 'Screen',
        knobs: [
          knob({ name: 'tone', title: 'Tone', options: ['a'] }),
          knob({ name: 'tone', title: 'Again', options: ['b'] }),
        ],
      }),
    ).toThrow(/tone/)
  })
})

describe('reaching a member spec through its host', () => {
  it('answers by the array field the member sits in', () => {
    expect(itemKnobsAt(grid, 'screens')).toBe(screenKnobs)
  })

  it('has nothing for an array whose members declare no knobs', () => {
    expect(itemKnobsAt(grid, 'panels')).toBeUndefined()
    expect(itemKnobsAt(undefined, 'screens')).toBeUndefined()
    expect(itemKnobsAt(grid, undefined)).toBeUndefined()
  })

  it('lets two blocks each declare a member called "screen"', () => {
    // The collision a `_type`-keyed registry would have to arbitrate: member
    // names are local to their array, and nothing in Sanity makes them unique.
    const otherScreen = defineItemKnobs({
      type: 'screen',
      title: 'Screen',
      knobs: [knob({ name: 'fit', title: 'Fit', options: ['cover', 'contain'] })],
    })
    const other = defineBlockKnobs({
      type: 'captureSection',
      title: 'Capture',
      tier: 'section',
      knobs: [],
      items: { screens: otherScreen },
    })
    expect(itemKnobsAt(grid, 'screens')?.knobs.map((k) => k.name)).toEqual(['tone', 'span'])
    expect(itemKnobsAt(other, 'screens')?.knobs.map((k) => k.name)).toEqual(['fit'])
  })

  it('does not resolve an inherited property to a spec', () => {
    // The key comes from a document path, so `constructor` is reachable.
    expect(itemKnobsAt(grid, 'constructor')).toBeUndefined()
  })
})

describe('what an item pick changes, per array', () => {
  it('names the array field and the member fields a knob writes', () => {
    expect(patchableItemRoots(grid)).toEqual({ screens: ['span', 'tone'] })
  })

  it('takes the first segment of a nested member path', () => {
    const panel = defineItemKnobs({
      type: 'panel',
      title: 'Panel',
      knobs: [
        knob({ name: 'media.ratio', title: 'Ratio', options: ['wide'] }),
        knob({ name: 'media.fit', title: 'Fit', options: ['cover'] }),
      ],
    })
    const rail = defineBlockKnobs({
      type: 'railPanelsSection',
      title: 'Rail',
      tier: 'section',
      knobs: [],
      items: { panels: panel },
    })
    expect(patchableItemRoots(rail)).toEqual({ panels: ['media'] })
  })

  it('has nothing to say about a block with no knobbed arrays', () => {
    const plain = defineBlockKnobs({ type: 'plain', title: 'Plain', tier: 'section', knobs: [] })
    expect(patchableItemRoots(plain)).toEqual({})
  })
})
