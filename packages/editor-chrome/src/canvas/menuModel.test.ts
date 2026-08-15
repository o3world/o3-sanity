import { describe, expect, it } from 'vitest'
import {
  defineBlockKnobs,
  defineItemKnobs,
  defineObjectKnobs,
  knob,
  visibleKnobs,
} from '@o3/block-spec'

import { barKnobs, blockKnobReader } from './barKnobs'
import { CANVAS_CHROME_ATTR, dismissesMenu, knobMenuModel, OPEN_FORM_ACTION } from './menuModel'

const BLOCK = 'sections[_key=="abc"]'
const ITEM = `${BLOCK}.panels[_key=="p1"]`

/**
 * A block with one knob on each surface, and one of them off the bar — the
 * shape the split exists for. `decoration` is the real `heroSection` case:
 * declared, gated, applied, and on no bar.
 */
const hero = defineBlockKnobs({
  type: 'heroSection',
  title: 'Hero',
  tier: 'section',
  knobs: [
    knob({ name: 'variant', title: 'Composition', options: ['orbital', 'band'], bar: true }),
    knob({ name: 'decoration', title: 'Decoration', options: ['orbs', 'none'] }),
    knob({ name: 'surface', title: 'Surface', options: ['white', 'bone', 'ink'], bar: true }),
    knob({
      name: 'eyebrow',
      title: 'Eyebrow',
      options: ['on', 'off'],
      showWhen: { at: 'variant', mode: 'oneOf', values: ['band'] },
    }),
  ],
})

/**
 * The member's own declaration (#122). `tone` is a path relative to the PANEL,
 * so nothing about it is expressible on the block above — which is why it lives
 * here and not in `hero.knobs`.
 */
const panel = defineItemKnobs({
  type: 'panel',
  title: 'Panel',
  knobs: [
    knob({ name: 'tone', title: 'Tone', options: ['plain', 'wide'] }),
    knob({
      name: 'span',
      title: 'Span',
      options: ['one', 'two'],
      showWhen: { at: 'tone', mode: 'oneOf', values: ['wide'] },
    }),
  ],
})

/**
 * The component's own declaration (#145), keyed by a GLOBAL type name. The same
 * spec answers for a mark on the block, a mark inside the panel and a mark in a
 * layout column — nothing about it names a placement.
 */
const markKnobs = defineObjectKnobs({
  type: 'mark',
  title: 'Mark',
  knobs: [
    knob({ name: 'kind', title: 'Kind', options: ['orb', 'disc'] }),
    knob({
      name: 'state',
      title: 'State',
      options: ['working', 'solving'],
      showWhen: { at: 'kind', mode: 'oneOf', values: ['orb'], emptyMatches: true },
    }),
  ],
})

const snapshotWith = (block: Record<string, unknown>, item: Record<string, unknown> = {}) => ({
  sections: [
    {
      _key: 'abc',
      _type: 'heroSection',
      ...block,
      panels: [{ _key: 'p1', _type: 'panel', ...item }],
    },
  ],
})

const menuFor = (
  block: Record<string, unknown>,
  subject: { kind: 'block' | 'item'; title?: string } = { kind: 'block', title: 'Hero section' },
  { nested = false, item = {} }: { nested?: boolean; item?: Record<string, unknown> } = {},
) => {
  const snapshot = snapshotWith(block, item)
  return knobMenuModel({
    spec: hero,
    read: blockKnobReader(snapshot, BLOCK),
    nested,
    // The toolbar passes this exactly when an item spec resolved for the
    // hovered member, which is exactly when the subject is that member.
    ...(subject.kind === 'item'
      ? { item: { spec: panel, read: blockKnobReader(snapshot, ITEM) } }
      : {}),
    subject,
    componentName: 'Hero section',
  })
}

const titlesIn = (
  model: ReturnType<typeof knobMenuModel>,
  surface: 'band' | 'block' | 'item' | 'instance',
): string[] =>
  model.groups.find((group) => group.surface === surface)?.knobs.map((r) => r.knob.title) ?? []

describe('what the menu carries that the bar does not', () => {
  it('carries the complete roster, where the bar carries the curated subset', () => {
    const model = menuFor({ variant: 'orbital' })
    const inMenu = model.groups.flatMap((group) => group.knobs.map((r) => r.knob.name))
    const onBar = barKnobs({
      spec: hero,
      read: blockKnobReader(snapshotWith({ variant: 'orbital' }), BLOCK),
      nested: false,
    }).map((r) => r.knob.name)

    // The whole reason both surfaces exist: `decoration` resolves, applies, and
    // rides no bar. Before the menu it was reachable from nowhere.
    expect(onBar).not.toContain('decoration')
    expect(inMenu).toContain('decoration')
    expect(onBar.every((name) => inMenu.includes(name))).toBe(true)
  })

  it('is exactly `visibleKnobs(...).all`, regrouped and not re-decided', () => {
    // The grouping is a presentation of the roster. Nothing may be delivered
    // that the one query did not return, and nothing it returned for a
    // deliverable surface may go missing.
    const read = blockKnobReader(snapshotWith({ variant: 'band' }), BLOCK)
    const { all } = visibleKnobs({ spec: hero, read, nested: false })
    const model = knobMenuModel({
      spec: hero,
      read,
      nested: false,
      subject: { kind: 'item', title: 'Panel' },
      componentName: 'Hero section',
    })

    expect(
      model.groups
        .flatMap((group) => group.knobs)
        .map((r) => r.knob.name)
        .sort(),
    ).toEqual(all.map((r) => r.knob.name).sort())
  })

  it('resolves each knob’s current value the same way every other surface does', () => {
    const chosen = menuFor({ variant: 'band' })
    expect(titlesIn(chosen, 'block')).toContain('Composition')
    const variant = chosen.groups
      .flatMap((group) => group.knobs)
      .find((r) => r.knob.name === 'variant')
    expect(variant!.current).toEqual({ value: 'band', title: 'Band', isDefault: false })
  })
})

describe('gated identically to the form', () => {
  it('drops a knob whose showWhen is closed, and offers it when it opens', () => {
    expect(titlesIn(menuFor({ variant: 'orbital' }), 'block')).not.toContain('Eyebrow')
    expect(titlesIn(menuFor({ variant: 'band' }), 'block')).toContain('Eyebrow')
  })

  it('drops the band group entirely for a nested block, rather than emptying it', () => {
    // A nested block forms no band — its host owns the strip — and a group with
    // nothing under it is a group that says the band is configurable here.
    const nested = menuFor(
      { variant: 'band' },
      { kind: 'block', title: 'Hero section' },
      {
        nested: true,
      },
    )
    expect(nested.groups.map((group) => group.surface)).not.toContain('band')
  })
})

describe('the no-dead-control rule', () => {
  it('omits the item group when the block is the subject, because no item is named', () => {
    // With the cursor in band padding there is no member for an item knob to
    // write to. The row could only patch a path the menu cannot resolve.
    expect(menuFor({}).groups.map((group) => group.surface)).toEqual(['band', 'block'])
  })

  it('offers the item group the moment an item is the subject', () => {
    const model = menuFor({}, { kind: 'item', title: 'Panel' })
    expect(model.groups.map((group) => group.surface)).toEqual(['band', 'block', 'item'])
    expect(titlesIn(model, 'item')).toEqual(['Tone'])
  })

  it('resolves an item knob against THAT member, not against the block', () => {
    // One panel, one answer. The block-rooted spelling this replaces returned
    // one resolution for every member of the array.
    const model = menuFor(
      { variant: 'band' },
      { kind: 'item', title: 'Panel' },
      {
        item: { tone: 'wide' },
      },
    )
    const tone = model.groups
      .find((group) => group.surface === 'item')!
      .knobs.find((r) => r.knob.name === 'tone')
    expect(tone!.current).toEqual({ value: 'wide', title: 'Wide', isDefault: false })
  })

  it('reads an item knob’s gate at the member root, like any same-root gate', () => {
    const closed = menuFor({}, { kind: 'item', title: 'Panel' }, { item: { tone: 'plain' } })
    const open = menuFor({}, { kind: 'item', title: 'Panel' }, { item: { tone: 'wide' } })
    expect(titlesIn(closed, 'item')).toEqual(['Tone'])
    expect(titlesIn(open, 'item')).toEqual(['Tone', 'Span'])
  })

  it('omits the item group for a member whose type declares no knobs', () => {
    // The lookup missed, so there is nothing to offer — and a row here could
    // only write to a spec the menu does not have.
    const model = knobMenuModel({
      spec: hero,
      read: blockKnobReader(snapshotWith({}), BLOCK),
      nested: false,
      subject: { kind: 'item', title: 'Figure' },
      componentName: 'Hero section',
    })
    expect(model.groups.map((group) => group.surface)).toEqual(['band', 'block'])
  })

  it('builds no group at all for a surface with no surviving knobs', () => {
    const bare = defineBlockKnobs({
      type: 'mediaSection',
      title: 'Media',
      tier: 'section',
      knobs: [knob({ name: 'width', title: 'Width', options: ['contained', 'full'] })],
    })
    const model = knobMenuModel({
      spec: bare,
      read: () => undefined,
      nested: false,
      subject: { kind: 'item', title: 'Figure' },
      componentName: 'Media section',
    })
    expect(model.groups.map((group) => group.surface)).toEqual(['block'])
    expect(model.groups.every((group) => group.knobs.length > 0)).toBe(true)
  })

  it('still opens for a block that has declared no knobs yet', () => {
    // ADR 0020 is a migration: an unconverted block has knobs the form shows
    // and the canvas cannot. The jump is the honest answer, so the menu keeps
    // it and drops everything else.
    const model = knobMenuModel({
      spec: undefined,
      read: () => undefined,
      nested: false,
      subject: { kind: 'block', title: 'Media section' },
      componentName: 'Media section',
    })
    expect(model.groups).toEqual([])
    expect(model.actions).toEqual([OPEN_FORM_ACTION])
  })
})

describe('what the menu says it is about', () => {
  it('names the item when one is the subject, and the block otherwise', () => {
    expect(menuFor({}, { kind: 'item', title: 'Panel' }).title).toBe('Panel')
    expect(menuFor({}).title).toBe('Hero section')
  })

  it('titles each group with the container it configures, so no group lies', () => {
    const model = menuFor({}, { kind: 'item', title: 'Panel' })
    expect(model.groups.map((group) => group.title)).toEqual(['Band', 'Hero section', 'Panel'])
  })

  it('falls back to the surface’s own name while the draft snapshot settles', () => {
    // Between the first hover and the snapshot arriving there is no component
    // name. A group titled by its surface still says what it configures.
    const model = knobMenuModel({
      spec: hero,
      read: () => undefined,
      nested: false,
      item: { spec: panel, read: () => undefined },
      subject: { kind: 'item' },
      componentName: undefined,
    })
    expect(model.title).toBeUndefined()
    expect(model.groups.map((group) => group.title)).toEqual(['Band', 'Block', 'Item'])
  })

  it('orders the groups outside-in, the same way the bar orders its controls', () => {
    expect(menuFor({}, { kind: 'item', title: 'Panel' }).groups.map((g) => g.surface)).toEqual([
      'band',
      'block',
      'item',
    ])
  })

  it('puts the jump last, always, and never anything after it', () => {
    expect(menuFor({}).actions).toEqual([OPEN_FORM_ACTION])
    expect(OPEN_FORM_ACTION.title).toContain('open form')
  })
})

describe('the instance the cursor is in (#145)', () => {
  const MARK = `${ITEM}.mark`
  const snapshot = {
    sections: [
      {
        _key: 'abc',
        _type: 'heroSection',
        panels: [{ _key: 'p1', _type: 'panel', mark: { _type: 'mark', kind: 'orb' } }],
      },
    ],
  }

  const menuWithMark = (mark?: { spec: typeof markKnobs; read: (path: string) => unknown }) =>
    knobMenuModel({
      spec: hero,
      read: blockKnobReader(snapshot, BLOCK),
      nested: false,
      item: { spec: panel, read: blockKnobReader(snapshot, ITEM) },
      instance: mark ?? { spec: markKnobs, read: blockKnobReader(snapshot, MARK) },
      subject: { kind: 'item', title: 'Panel' },
      componentName: 'Hero section',
    })

  it('delivers the instance’s roster in its own group, innermost of the four', () => {
    const model = menuWithMark()
    expect(model.groups.map((group) => group.surface)).toEqual([
      'band',
      'block',
      'item',
      'instance',
    ])
    expect(titlesIn(model, 'instance')).toEqual(['Kind', 'State'])
  })

  it('titles the group with the COMPONENT, not with where it was placed', () => {
    // "An instance is configured by its component" is a claim about the title
    // as much as about the roster: a mark is a Mark in a panel, in a column and
    // on a block alike.
    expect(menuWithMark().groups.at(-1)?.title).toBe('Mark')
  })

  it('gates against the instance’s own value, not the block’s', () => {
    const disc = {
      sections: [
        {
          _key: 'abc',
          _type: 'heroSection',
          panels: [{ _key: 'p1', _type: 'panel', mark: { _type: 'mark', kind: 'disc' } }],
        },
      ],
    }
    const model = menuWithMark({ spec: markKnobs, read: blockKnobReader(disc, MARK) })
    expect(titlesIn(model, 'instance')).toEqual(['Kind'])
  })

  it('is absent, never empty, when no declared object encloses the cursor', () => {
    // The no-dead-control rule at the fourth root: a `figure` under the cursor
    // declares nothing, so there is no group rather than an empty one.
    expect(
      menuFor({}, { kind: 'item', title: 'Panel' }).groups.map((g) => g.surface),
    ).not.toContain('instance')
  })

  it('rides no bar, because the bar is docked at the band', () => {
    // `barKnobs` never sees an object spec. Stated here so a later `bar: true`
    // on an instance knob is understood as a declaration nothing reads.
    const onBar = barKnobs({
      spec: hero,
      read: blockKnobReader(snapshot, BLOCK),
      nested: false,
    }).map((r) => r.knob.name)
    expect(onBar).not.toContain('kind')
  })
})

describe('the item actions the menu carries (#111)', () => {
  const snapshot = {
    sections: [
      { _key: 'abc', _type: 'heroSection' },
      {
        _key: 'rail',
        _type: 'railPanelsSection',
        panels: [
          { _key: 'p1', _type: 'panel' },
          { _key: 'p2', _type: 'panel' },
        ],
      },
    ],
  }

  const model = (subjectPath: string, subject: { kind: 'block' | 'item'; title?: string }) =>
    knobMenuModel({
      spec: hero,
      read: blockKnobReader(snapshot, BLOCK),
      nested: false,
      subject,
      componentName: 'Hero section',
      snapshot,
      subjectPath,
    })

  it('acts on the subject the menu is already about, and not a second one', () => {
    // `subjectPath` is `itemPath ?? blockPath` — the same innermost keyed item
    // `canvasSubject` computed and the same one `subject.kind` came from. Here
    // that is the panel, so Remove patches `panels` and not `sections`.
    const panel = model('sections[_key=="rail"].panels[_key=="p1"]', {
      kind: 'item',
      title: 'Panel',
    })
    const remove = panel.itemActions[0]!.actions.find((action) => action.id === 'remove')!
    expect(remove.patches[0]!.path).toEqual(['sections', { _key: 'rail' }, 'panels'])
  })

  it('offers the same actions on a block as on an item inside one', () => {
    const block = model('sections[_key=="abc"]', { kind: 'block', title: 'Hero section' })
    expect(block.itemActions.map((group) => group.id)).toEqual(['item', 'move'])
    expect(block.itemActions[0]!.actions.map((action) => action.id)).toEqual([
      'duplicate',
      'remove',
    ])
  })

  it('carries none at all while the snapshot has not resolved the subject', () => {
    // The frame between the first hover and the draft settling. The knob groups
    // and the jump still render; the rows that would patch nothing do not.
    const settling = knobMenuModel({
      spec: hero,
      read: () => undefined,
      nested: false,
      subject: { kind: 'block', title: 'Hero section' },
      componentName: 'Hero section',
      snapshot: undefined,
      subjectPath: BLOCK,
    })
    expect(settling.itemActions).toEqual([])
    expect(settling.actions).toEqual([OPEN_FORM_ACTION])
  })

  it('carries none for a caller that passes no subject path', () => {
    // The bar-only render path, and every test that predates #111.
    expect(menuFor({}).itemActions).toEqual([])
  })

  it('keeps the jump last, after the actions as well as after the knobs', () => {
    const block = model('sections[_key=="abc"]', { kind: 'block', title: 'Hero section' })
    expect(block.actions).toEqual([OPEN_FORM_ACTION])
    expect(block.itemActions.length).toBeGreaterThan(0)
  })
})

describe('the insert rows the menu carries (#112)', () => {
  const snapshot = {
    _type: 'page',
    sections: [{ _key: 'abc', _type: 'heroSection' }],
  }

  const quote = defineBlockKnobs({
    type: 'quoteSection',
    title: 'Quote',
    tier: 'section',
    knobs: [knob({ name: 'surface', title: 'Surface', options: ['white', 'ink'] })],
    placeholder: { _type: 'quoteSection', quote: 'Add the quote.' },
  })

  const model = (insert?: Parameters<typeof knobMenuModel>[0]['insert']) =>
    knobMenuModel({
      spec: hero,
      read: blockKnobReader(snapshot, BLOCK),
      nested: false,
      subject: { kind: 'block', title: 'Hero section' },
      componentName: 'Hero section',
      snapshot,
      subjectPath: BLOCK,
      insert,
    })

  it('offers what the array accepts, above and below', () => {
    const groups = model({
      members: ['quoteSection'],
      specs: { quoteSection: quote },
    }).insertActions

    expect(groups.map((group) => group.title)).toEqual(['Add above', 'Add below'])
    expect(groups[0]!.actions.map((action) => action.title)).toEqual(['Quote'])
  })

  // A caller that could not address the array — or a site that declared none —
  // gets a menu with no insert rows rather than a guess at what belongs here.
  it('offers nothing when the array was not declared', () => {
    expect(model().insertActions).toEqual([])
  })

  it('keeps the insert rows separate from the actions ON the subject', () => {
    const built = model({ members: ['quoteSection'], specs: { quoteSection: quote } })

    // Duplicate/Remove act on the hero; Add above/below act on `sections`.
    // Same shape, two questions — the menu draws a rule between them.
    expect(
      built.itemActions.flatMap((group) => group.actions.map((action) => action.id)),
    ).toContain('duplicate')
    expect(
      built.insertActions.flatMap((group) => group.actions.map((action) => action.id)),
    ).toEqual(['insert-before-quoteSection', 'insert-after-quoteSection'])
  })
})

describe('what dismisses an open menu', () => {
  interface FakeNode {
    hasAttribute(name: string): boolean
    parentElement: FakeNode | null
  }

  const node = (chrome: boolean, parentElement: FakeNode | null = null): FakeNode => ({
    hasAttribute: (name) => chrome && name === CANVAS_CHROME_ATTR,
    parentElement,
  })

  it('dismisses on a pointerdown outside every piece of our chrome', () => {
    expect(dismissesMenu(node(false, node(false)))).toBe(true)
    expect(dismissesMenu<FakeNode>(null)).toBe(true)
  })

  it('exempts the opener, so its own click toggles rather than close-then-reopen', () => {
    // The trigger lives inside the bar, and the bar carries the attribute — so
    // one mark on the container exempts every opener it holds.
    const bar = node(true)
    expect(dismissesMenu(node(false, bar))).toBe(false)
    expect(dismissesMenu(bar)).toBe(false)
  })

  it('exempts the menu’s own rows, so picking an option does not close it first', () => {
    const panel = node(true)
    expect(dismissesMenu(node(false, node(false, panel)))).toBe(false)
  })
})
