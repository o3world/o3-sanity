import { defineBlockKnobs, defineItemKnobs, knob } from '@o3/block-spec'
import { describe, expect, it } from 'vitest'

import {
  applyKnobArgs,
  gateSourcePaths,
  itemArgTarget,
  itemKnobControls,
  knobControls,
  matrixAxes,
  matrixCells,
  rosterKnobs,
  storybookCondition,
} from './knobArgs'
import { FIXTURE_VALUE, knobId } from './knobs'

/**
 * A stand-in for a real block: two plain knobs, one gated on the first, one
 * band knob that a nested block drops. Written here rather than imported from
 * `@o3/sanity/knobs` so the adapter's rules are tested against the vocabulary
 * rather than against one block's current shape.
 */
const spec = defineBlockKnobs({
  type: 'exampleSection',
  title: 'Example',
  tier: 'section',
  knobs: [
    knob({
      name: 'variant',
      title: 'Composition',
      options: ['orbital', 'band'],
      initialValue: 'orbital',
    }),
    knob({
      name: 'decoration',
      title: 'Decoration',
      options: ['orbs', 'none'],
      initialValue: 'orbs',
    }),
    knob({
      name: 'kicker',
      title: 'Kicker',
      options: ['caps', 'plain'],
      initialValue: 'caps',
      showWhen: { at: 'variant', mode: 'oneOf', values: ['band'] },
    }),
    knob({
      name: 'surface',
      title: 'Surface',
      options: ['white', 'bone', 'ink'],
      initialValue: 'ink',
    }),
  ],
})

const fixture = { variant: 'orbital', decoration: 'orbs', surface: 'ink' }

describe('gateSourcePaths', () => {
  it('names the knobs another knob’s gate reads', () => {
    expect([...gateSourcePaths(spec.knobs)]).toEqual(['variant'])
  })

  it('ignores a gate on a path the block declares no knob for', () => {
    const editorial = defineBlockKnobs({
      type: 'x',
      title: 'X',
      tier: 'section',
      knobs: [
        knob({
          name: 'layout',
          title: 'Layout',
          options: ['a', 'b'],
          showWhen: { at: 'eyebrow', mode: 'present' },
        }),
      ],
    })
    expect(gateSourcePaths(editorial.knobs).size).toBe(0)
  })

  it('flattens an allOf gate', () => {
    const compound = defineBlockKnobs({
      type: 'x',
      title: 'X',
      tier: 'section',
      knobs: [
        knob({ name: 'variant', title: 'V', options: ['a', 'b'] }),
        knob({ name: 'decoration', title: 'D', options: ['on', 'off'] }),
        knob({
          name: 'tint',
          title: 'T',
          options: ['warm', 'cool'],
          showWhen: {
            mode: 'allOf',
            all: [
              { at: 'variant', mode: 'oneOf', values: ['a'] },
              { at: 'decoration', mode: 'oneOf', values: ['on'] },
            ],
          },
        }),
      ],
    })
    expect([...gateSourcePaths(compound.knobs)].sort()).toEqual(['decoration', 'variant'])
  })
})

describe('rosterKnobs', () => {
  it('offers a gated knob the fixture hides, because a control can reach it', () => {
    expect(rosterKnobs({ spec, fixture }).map((k) => k.name)).toEqual([
      'variant',
      'decoration',
      'kicker',
      'surface',
    ])
  })

  it('drops band knobs when the block is nested', () => {
    expect(rosterKnobs({ spec, fixture, nested: true }).map((k) => k.name)).not.toContain('surface')
  })

  it('withholds a knob gated on something no control can change', () => {
    const editorial = defineBlockKnobs({
      type: 'x',
      title: 'X',
      tier: 'section',
      knobs: [
        knob({
          name: 'layout',
          title: 'Layout',
          options: ['a', 'b'],
          showWhen: { at: 'eyebrow', mode: 'present' },
        }),
      ],
    })
    expect(rosterKnobs({ spec: editorial, fixture: {} })).toEqual([])
    expect(
      rosterKnobs({ spec: editorial, fixture: { eyebrow: 'WORK' } }).map((k) => k.name),
    ).toEqual(['layout'])
  })

  it('answers for an array member the same way it answers for a block', () => {
    // A member is its own knob root (#122), so nothing here needs to know it is
    // one — same walk, same gate, one root down.
    expect(
      rosterKnobs({ spec: screenKnobs, fixture: { tone: 'wide' } }).map((k) => k.name),
    ).toEqual(['tone', 'span'])
    expect(rosterKnobs({ spec: screenKnobs, fixture: {} }).map((k) => k.name)).toEqual([
      'tone',
      'span',
    ])
  })
})

/** A block whose array members declare their own options (#122). */
const screenKnobs = defineItemKnobs({
  type: 'screen',
  title: 'Screen',
  knobs: [
    knob({ name: 'tone', title: 'Tone', options: ['ink', 'wide'], initialValue: 'ink' }),
    knob({
      name: 'span',
      title: 'Span',
      options: ['standard', 'full'],
      showWhen: { at: 'tone', mode: 'oneOf', values: ['wide'] },
    }),
  ],
})

const grid = defineBlockKnobs({
  type: 'screenGridSection',
  title: 'Screen grid',
  tier: 'section',
  knobs: [knob({ name: 'surface', title: 'Surface', options: ['white', 'ink'] })],
  items: { screens: screenKnobs },
})

type Screen = { _key: string; tone: string; span?: string; media: { url: string } }

const gridFixture: { surface: string; screens: Screen[] } = {
  surface: 'white',
  screens: [
    { _key: 'a', tone: 'ink', media: { url: '/a.png' } },
    { _key: 'b', tone: 'wide', media: { url: '/b.png' } },
  ],
}

describe('the item story surface', () => {
  it('offers one control per member, categorised by the member it paints', () => {
    const { argTypes, idToPath } = itemKnobControls({ spec: grid, fixture: gridFixture })
    expect(Object.values(idToPath).sort()).toEqual([
      'screens.0.span',
      'screens.0.tone',
      'screens.1.span',
      'screens.1.tone',
    ])
    expect(argTypes[knobId('screens.0.tone')]?.table.category).toBe('Screen 1')
    expect(argTypes[knobId('screens.1.tone')]?.table.category).toBe('Screen 2')
  })

  it('points a gate at the arg on the SAME member, not at a member-relative id', () => {
    const { argTypes } = itemKnobControls({ spec: grid, fixture: gridFixture })
    expect(argTypes[knobId('screens.1.span')]?.if).toEqual({
      arg: knobId('screens.1.tone'),
      eq: 'wide',
    })
  })

  it('has nothing to offer a block with no knobbed arrays', () => {
    expect(itemKnobControls({ spec, fixture: {} }).idToPath).toEqual({})
  })

  it('splits a story path back into the member and the path inside it', () => {
    expect(itemArgTarget(grid, 'screens.1.tone')).toMatchObject({
      field: 'screens',
      index: 1,
      memberPath: 'screens.1',
      rel: 'tone',
    })
    expect(itemArgTarget(grid, 'surface')).toBeUndefined()
    expect(itemArgTarget(grid, 'panels.0.tone')).toBeUndefined()
    expect(itemArgTarget(screenKnobs, 'screens.0.tone')).toBeUndefined()
  })

  it('writes a pick into that member and leaves its siblings alone', () => {
    const { idToPath } = itemKnobControls({ spec: grid, fixture: gridFixture })
    const next = applyKnobArgs({
      spec: grid,
      fixture: gridFixture,
      args: { [knobId('screens.0.tone')]: 'wide' },
      idToPath,
    })
    expect(next.screens.map((screen) => screen.tone)).toEqual(['wide', 'wide'])
    // The array is still an array, and the untouched member is untouched.
    expect(Array.isArray(next.screens)).toBe(true)
    expect(next.screens[1]).toBe(gridFixture.screens[1])
    expect(next.screens[0]?.media).toEqual({ url: '/a.png' })
  })

  it('refuses an item control that the member’s own gate hides', () => {
    // The same guarantee as the block's, one root down: `span` shows only on a
    // `wide` screen, so a control cannot set it on an `ink` one.
    const { idToPath } = itemKnobControls({ spec: grid, fixture: gridFixture })
    const next = applyKnobArgs({
      spec: grid,
      fixture: gridFixture,
      args: { [knobId('screens.0.span')]: 'full', [knobId('screens.1.span')]: 'full' },
      idToPath,
    })
    expect(next.screens[0]?.span).toBeUndefined()
    expect(next.screens[1]?.span).toBe('full')
  })
})

describe('storybookCondition', () => {
  const hasControl = () => true

  it('maps a single-value oneOf to eq', () => {
    expect(
      storybookCondition({ at: 'variant', mode: 'oneOf', values: ['band'] }, hasControl),
    ).toEqual({ arg: 'variant', eq: 'band' })
  })

  it('maps a single-value notOneOf to neq', () => {
    expect(
      storybookCondition({ at: 'variant', mode: 'notOneOf', values: ['band'] }, hasControl),
    ).toEqual({ arg: 'variant', neq: 'band' })
  })

  it('maps present to truthy', () => {
    expect(storybookCondition({ at: 'media', mode: 'present' }, hasControl)).toEqual({
      arg: 'media',
      truthy: true,
    })
  })

  it('flattens a dotted path into the arg key', () => {
    expect(storybookCondition({ at: 'media.ratio', mode: 'present' }, hasControl)?.arg).toBe(
      knobId('media.ratio'),
    )
  })

  it('declines what Storybook’s one-arg condition cannot say', () => {
    expect(
      storybookCondition({ at: 'variant', mode: 'oneOf', values: ['band', 'orbital'] }, hasControl),
    ).toBeUndefined()
    expect(
      storybookCondition(
        { mode: 'allOf', all: [{ at: 'variant', mode: 'oneOf', values: ['band'] }] },
        hasControl,
      ),
    ).toBeUndefined()
    expect(storybookCondition(undefined, hasControl)).toBeUndefined()
  })

  it('declines a gate on a path with no control', () => {
    expect(storybookCondition({ at: 'eyebrow', mode: 'present' }, () => false)).toBeUndefined()
  })
})

describe('knobControls', () => {
  const controls = knobControls({ spec, fixture })

  it('derives one select per knob, titled and described from the declaration', () => {
    expect(Object.keys(controls.argTypes)).toEqual(['variant', 'decoration', 'kicker', 'surface'])
    expect(controls.argTypes.decoration).toMatchObject({
      name: 'Decoration',
      control: 'select',
      options: [FIXTURE_VALUE, 'orbs', 'none'],
      table: { category: 'Knobs' },
    })
  })

  it('leaves an ungated knob on the fixture sentinel', () => {
    expect(controls.args.decoration).toBe(FIXTURE_VALUE)
    expect(controls.args.surface).toBe(FIXTURE_VALUE)
  })

  it('pins a gate source to the fixture’s resolved value and drops its sentinel', () => {
    expect(controls.args.variant).toBe('orbital')
    expect(controls.argTypes.variant?.options).toEqual(['orbital', 'band'])
  })

  it('resolves a gate source through initialValue when the fixture is silent', () => {
    expect(knobControls({ spec, fixture: {} }).args.variant).toBe('orbital')
  })

  it('keeps the sentinel for a gate source that resolves to nothing', () => {
    const undefaulted = defineBlockKnobs({
      type: 'x',
      title: 'X',
      tier: 'section',
      knobs: [
        knob({ name: 'variant', title: 'V', options: ['a', 'b'] }),
        knob({
          name: 'tint',
          title: 'T',
          options: ['warm'],
          showWhen: { at: 'variant', mode: 'oneOf', values: ['a'] },
        }),
      ],
    })
    const bare = knobControls({ spec: undefaulted, fixture: {} })
    expect(bare.args.variant).toBe(FIXTURE_VALUE)
    expect(bare.argTypes.variant?.options).toEqual([FIXTURE_VALUE, 'a', 'b'])
  })

  it('carries the declared gate onto the control as Storybook’s if', () => {
    expect(controls.argTypes.kicker?.if).toEqual({ arg: 'variant', eq: 'band' })
    expect(controls.argTypes.decoration?.if).toBeUndefined()
  })

  it('maps every arg key back to its knob path', () => {
    expect(controls.idToPath).toEqual({
      variant: 'variant',
      decoration: 'decoration',
      kicker: 'kicker',
      surface: 'surface',
    })
  })
})

describe('applyKnobArgs', () => {
  const { idToPath } = knobControls({ spec, fixture })
  const apply = (args: Record<string, unknown>) => applyKnobArgs({ spec, fixture, args, idToPath })

  it('leaves the fixture alone where the sentinel is set', () => {
    expect(apply({ variant: 'orbital', decoration: FIXTURE_VALUE })).toEqual(fixture)
  })

  it('sets a visible knob', () => {
    expect(apply({ variant: 'orbital', decoration: 'none' })).toMatchObject({ decoration: 'none' })
  })

  it('refuses to set a knob the gate hides under the state being rendered', () => {
    expect(apply({ variant: 'orbital', kicker: 'plain' })).not.toHaveProperty('kicker')
  })

  it('sets that same knob once the gate opens', () => {
    expect(apply({ variant: 'band', kicker: 'plain' })).toMatchObject({
      variant: 'band',
      kicker: 'plain',
    })
  })

  it('refuses to set a band knob on a nested block', () => {
    const nestedApplied = applyKnobArgs({
      spec,
      fixture,
      args: { surface: 'bone' },
      idToPath,
      nested: true,
    })
    expect(nestedApplied.surface).toBe('ink')
  })

  it('does not mutate the fixture', () => {
    apply({ decoration: 'none' })
    expect(fixture.decoration).toBe('orbs')
  })
})

describe('matrixAxes', () => {
  const knobs = rosterKnobs({ spec, fixture })

  it('defaults to the first two knobs that offer a choice', () => {
    const { rows, cols } = matrixAxes({ knobs })
    expect([rows?.name, cols?.name]).toEqual(['variant', 'decoration'])
  })

  it('takes named axes', () => {
    const { rows, cols } = matrixAxes({ knobs, matrix: { rows: 'surface', cols: 'decoration' } })
    expect([rows?.name, cols?.name]).toEqual(['surface', 'decoration'])
  })

  it('refuses an axis the story offers no control for', () => {
    expect(() => matrixAxes({ knobs, matrix: { rows: 'nope' } })).toThrow(/not a knob/)
  })
})

describe('matrixCells', () => {
  const knobs = rosterKnobs({ spec, fixture })

  it('grids the cross product, labelled from the option titles', () => {
    const cells = matrixCells({ spec, fixture, axes: matrixAxes({ knobs }) })
    expect(cells.map((c) => c.label)).toEqual([
      'Composition: Orbital · Decoration: Orbs',
      'Composition: Orbital · Decoration: None',
      'Composition: Band · Decoration: Orbs',
      'Composition: Band · Decoration: None',
    ])
    expect(cells[3]?.data).toMatchObject({ variant: 'band', decoration: 'none' })
  })

  it('collapses a row whose value hides the column knob', () => {
    const cells = matrixCells({
      spec,
      fixture,
      axes: matrixAxes({ knobs, matrix: { rows: 'variant', cols: 'kicker' } }),
    })
    expect(cells.map((c) => c.label)).toEqual([
      'Composition: Orbital',
      'Composition: Band · Kicker: Caps',
      'Composition: Band · Kicker: Plain',
    ])
  })

  it('is empty when the block declares no knob to grid', () => {
    expect(matrixCells({ spec, fixture, axes: {} })).toEqual([])
  })
})
