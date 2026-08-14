import { defineBlockKnobs, knob } from '@o3/block-spec'
import type { BlockKnobs } from '@o3/block-spec'
import { describe, expect, it } from 'vitest'

import { blockArrayKey, insertActionGroups, insertItemPatch, insertOffers } from './insertActions'

/**
 * ADD ABOVE / ADD BELOW (#112), against a document snapshot.
 *
 * The thing worth asserting here is not that an insert inserts. It is that the
 * offer is **derived**: the rows are the array's declared members, resolved
 * through the declarations the site handed in, and there is no list anywhere of
 * what may or may not be inserted. So the tests below change the MEMBER LIST
 * and watch the menu change with it — which is the property the prior art's
 * `NOT_INSERTABLE_TYPES` could not have.
 *
 * The second thing is the address. A key is `<host type>.<field>`, and the host
 * is the document at the root and the enclosing block one level down; both
 * cases go through the same function, because two rules for where an array
 * hangs is how the wrong roster ends up on the right-looking band.
 */

const surface = knob({
  name: 'surface',
  title: 'Surface',
  options: ['white', 'bone', 'ink'],
  initialValue: 'bone',
})

const spec = (type: string, title: string, placeholder?: Record<string, unknown>): BlockKnobs =>
  defineBlockKnobs({
    type,
    title,
    tier: 'section',
    knobs: [surface],
    ...(placeholder ? { placeholder: { _type: type, ...placeholder } } : {}),
  })

const SPECS: Record<string, BlockKnobs> = {
  heroSection: spec('heroSection', 'Hero', { headlineLines: ['A headline for this hero.'] }),
  quoteSection: spec('quoteSection', 'Quote', { quote: 'Add the quote.' }),
  // Declared, and with nothing to insert — the one thing that narrows an offer.
  listingSection: spec('listingSection', 'Listing'),
}

/** A page with two sections, the second holding two panels. */
const page = () => ({
  _id: 'drafts.home',
  _type: 'page',
  sections: [
    { _key: 'a', _type: 'heroSection' },
    {
      _key: 'b',
      _type: 'railPanelsSection',
      panels: [
        { _key: 'p1', _type: 'panel' },
        { _key: 'p2', _type: 'panel' },
      ],
    },
  ],
})

const HERO = 'sections[_key=="a"]'
const PANEL = 'sections[_key=="b"].panels[_key=="p1"]'

describe('blockArrayKey', () => {
  it('addresses a document-level array by the document’s own type', () => {
    expect(blockArrayKey(page(), HERO)).toBe('page.sections')
  })

  it('addresses a nested array by the block that hosts it', () => {
    expect(blockArrayKey(page(), PANEL)).toBe('railPanelsSection.panels')
  })

  // Every reason the snapshot cannot answer means the same thing to the menu:
  // no rows, rather than a guess at what this array might take.
  it('answers nothing before the snapshot has settled', () => {
    expect(blockArrayKey(undefined, HERO)).toBeUndefined()
  })

  it('answers nothing for a path that is not an array item', () => {
    expect(blockArrayKey(page(), 'sections[_key=="a"].heading')).toBeUndefined()
  })
})

describe('insertOffers', () => {
  it('offers the array’s members, in the array’s own order', () => {
    const offers = insertOffers({ members: ['quoteSection', 'heroSection'], specs: SPECS })
    expect(offers.map((offer) => offer.type)).toEqual(['quoteSection', 'heroSection'])
    expect(offers.map((offer) => offer.title)).toEqual(['Quote', 'Hero'])
  })

  // The offer follows the member list and nothing else — no denylist stands
  // between a declared member and a row.
  it('offers exactly what the member list names', () => {
    expect(insertOffers({ members: ['heroSection'], specs: SPECS })).toHaveLength(1)
    expect(insertOffers({ members: [], specs: SPECS })).toHaveLength(0)
  })

  it('skips a member with no declaration and one with no placeholder', () => {
    const offers = insertOffers({
      members: ['heroSection', 'listingSection', 'formSection'],
      specs: SPECS,
    })
    expect(offers.map((offer) => offer.type)).toEqual(['heroSection'])
  })

  it('carries the block’s knob defaults in what it would write', () => {
    const [hero] = insertOffers({ members: ['heroSection'], specs: SPECS })
    expect(hero!.content).toMatchObject({ _type: 'heroSection', surface: 'bone' })
  })
})

describe('insertItemPatch', () => {
  it('inserts against the parent array, referenced by the subject’s key', () => {
    const patches = insertItemPatch(page(), HERO, 'before', { _type: 'quoteSection' })!

    expect(patches).toHaveLength(1)
    expect(patches[0]!.path).toEqual(['sections'])
    expect(patches[0]!.op).toMatchObject({
      type: 'insert',
      referenceItem: { _key: 'a' },
      position: 'before',
    })
  })

  // Sanity's own charset and length, the same as every sibling key in the
  // array — `randomKey(12)` from `@sanity/util/content`.
  it('mints a Studio-shaped key', () => {
    const patches = insertItemPatch(page(), HERO, 'after', { _type: 'quoteSection' })!
    const op = patches[0]!.op as { items: { _key: string }[] }
    expect(op.items[0]!._key).toMatch(/^[0-9a-f]{12}$/)
  })

  it('inserts into the nested array when the subject is a panel', () => {
    const patches = insertItemPatch(page(), PANEL, 'after', { _type: 'quoteSection' })!
    expect(patches[0]!.path).toEqual(['sections', { _key: 'b' }, 'panels'])
  })

  it('answers nothing for an item the snapshot does not hold', () => {
    expect(
      insertItemPatch(page(), 'sections[_key=="gone"]', 'after', { _type: 'quoteSection' }),
    ).toBeUndefined()
  })
})

describe('insertActionGroups', () => {
  const groupsFor = (members: readonly string[], itemPath = HERO) =>
    insertActionGroups({ snapshot: page(), itemPath, members, specs: SPECS })

  it('builds one group per position, each listing the whole offer', () => {
    const groups = groupsFor(['heroSection', 'quoteSection'])

    expect(groups.map((group) => group.id)).toEqual(['insert-before', 'insert-after'])
    expect(groups.map((group) => group.title)).toEqual(['Add above', 'Add below'])
    expect(groups[0]!.actions.map((action) => action.id)).toEqual([
      'insert-before-heroSection',
      'insert-before-quoteSection',
    ])
    expect(groups[1]!.actions.map((action) => action.title)).toEqual(['Hero', 'Quote'])
  })

  // Absent, never empty — the rule every group in this menu follows.
  it('builds no group when the array accepts nothing it can insert', () => {
    expect(groupsFor(['listingSection'])).toEqual([])
    expect(groupsFor([])).toEqual([])
  })

  it('builds no group before the subject is in the snapshot', () => {
    expect(groupsFor(['heroSection'], 'sections[_key=="gone"]')).toEqual([])
  })

  // Two rows for one type must not write one object twice: each carries its own
  // body, so the keys an editor ends up with are unique whichever they click.
  it('gives every row its own freshly keyed content', () => {
    const groups = groupsFor(['heroSection'])
    const keyOf = (group: (typeof groups)[number]) =>
      (group.actions[0]!.patches[0]!.op as { items: { _key: string }[] }).items[0]!._key

    expect(keyOf(groups[0]!)).not.toBe(keyOf(groups[1]!))
  })
})
