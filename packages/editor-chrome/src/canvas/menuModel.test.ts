import { describe, expect, it } from 'vitest'
import { defineBlockKnobs, knob, visibleKnobs } from '@o3/block-spec'

import { barKnobs, blockKnobReader } from './barKnobs'
import { CANVAS_CHROME_ATTR, dismissesMenu, knobMenuModel, OPEN_FORM_ACTION } from './menuModel'

const BLOCK = 'sections[_key=="abc"]'

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
    knob({ name: 'tone', title: 'Tone', options: ['plain', 'wide'], surface: 'item' }),
  ],
})

const snapshotWith = (block: Record<string, unknown>) => ({
  sections: [{ _key: 'abc', _type: 'heroSection', ...block }],
})

const menuFor = (
  block: Record<string, unknown>,
  subject: { kind: 'block' | 'item'; title?: string } = { kind: 'block', title: 'Hero section' },
  { nested = false }: { nested?: boolean } = {},
) =>
  knobMenuModel({
    spec: hero,
    read: blockKnobReader(snapshotWith(block), BLOCK),
    nested,
    subject,
    componentName: 'Hero section',
  })

const titlesIn = (
  model: ReturnType<typeof knobMenuModel>,
  surface: 'band' | 'block' | 'item',
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
