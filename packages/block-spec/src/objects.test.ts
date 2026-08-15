import { describe, expect, it } from 'vitest'

import { defineBlockKnobs, defineItemKnobs, defineObjectKnobs, knob } from './knob'
import { visibleKnobs } from './visibleKnobs'

const kind = knob({ name: 'kind', title: 'Kind', options: ['orb', 'disc'], initialValue: 'orb' })
const state = knob({
  name: 'state',
  title: 'State',
  options: ['working', 'searching'],
  initialValue: 'working',
  showWhen: { at: 'kind', mode: 'oneOf', values: ['orb'], emptyMatches: true },
})

const markKnobs = defineObjectKnobs({ type: 'mark', title: 'Mark', knobs: [kind, state] })

describe('a shared object is its own knob root', () => {
  it('stamps the instance surface on every knob, whatever the prefix table would say', () => {
    // `surface` is the one prefix rule, so a knob called that would answer
    // `band` at declaration time. An object's knobs configure the instance
    // wherever it sits, so the spec stamps them rather than the table.
    const spec = defineObjectKnobs({
      type: 'mark',
      title: 'Mark',
      knobs: [knob({ name: 'surface', title: 'Surface', options: ['white'] })],
    })
    expect(spec.knobs.map((k) => k.surface)).toEqual(['instance'])
    expect(markKnobs.knobs.map((k) => k.surface)).toEqual(['instance', 'instance'])
  })

  it('discriminates against the other two roots by tier', () => {
    expect(markKnobs.tier).toBe('object')
    expect(defineItemKnobs({ type: 'screen', title: 'Screen', knobs: [kind] }).tier).toBe('item')
  })

  it('refuses two knobs on the same path', () => {
    expect(() => defineObjectKnobs({ type: 'mark', title: 'Mark', knobs: [kind, kind] })).toThrow(
      /kind/,
    )
  })

  it('answers every query at its own root, with no placement in the path', () => {
    // The same spec, read against two different placements — a mark on a
    // discipline row and a mark in a layout column. Both readers are rooted at
    // the instance, so the spec cannot tell them apart, which is the property
    // "an instance is configured by its component" has to have.
    const onARow = { kind: 'orb', state: 'searching' }
    const inAColumn = { kind: 'disc' }

    expect(
      visibleKnobs({ spec: markKnobs, read: (path) => onARow[path as 'kind'] }).all.map((r) => [
        r.knob.name,
        r.current.value,
      ]),
    ).toEqual([
      ['kind', 'orb'],
      ['state', 'searching'],
    ])

    // The gate closes on the disc, at the same root, with no block above it.
    expect(
      visibleKnobs({
        spec: markKnobs,
        read: (path) => (inAColumn as Record<string, unknown>)[path],
      }).all.map((r) => r.knob.name),
    ).toEqual(['kind'])
  })

  it('groups its knobs under the instance surface', () => {
    const { bySurface } = visibleKnobs({ spec: markKnobs, read: () => undefined })
    expect(bySurface.instance.map((r) => r.knob.name)).toEqual(['kind', 'state'])
    expect(bySurface.block).toEqual([])
    expect(bySurface.item).toEqual([])
  })
})

describe('a block cannot claim an instance knob', () => {
  it('refuses one, and names the constructor that owns it', () => {
    expect(() =>
      defineBlockKnobs({
        type: 'heroSection',
        title: 'Hero',
        tier: 'section',
        knobs: [
          knob({ name: 'kind', title: 'Kind', options: ['orb'], surface: 'instance' }),
          knob({ name: 'surface', title: 'Surface', options: ['white'] }),
        ],
      }),
    ).toThrow(/defineObjectKnobs/)
  })
})
