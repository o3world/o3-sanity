import { describe, expect, it } from 'vitest'
import type { NodePatch } from '@sanity/mutate'

import {
  duplicateItemPatch,
  itemActionGroups,
  moveItemPatch,
  removeItemPatch,
  type ItemMove,
} from './itemActions'

/**
 * DUPLICATE, REMOVE AND MOVE (#111), against a document snapshot.
 *
 * These are pure, so everything about them is reachable from the `unit`
 * project — which is `.test.ts` only and has no DOM, no Presentation, and no
 * Studio. That is the whole reason the builders take a snapshot and a path
 * rather than a mutator.
 *
 * TWO KINDS OF ASSERTION, and both are needed. The first pins the PATCH SHAPE:
 * `truncate` + `insert`, op for op, the same mutations
 * `@sanity/visual-editing@5.7.3`'s own builders emit, because an action from
 * our menu and the same action from the stock menu have to resolve conflicts
 * and record history identically. The second APPLIES the patches and looks at
 * the array that comes out, because a move's second patch indexes the array as
 * TRUNCATED and an off-by-one there is invisible in the patch object.
 */

/** A page with three sections, the middle one holding three panels. */
const page = () => ({
  _id: 'drafts.home',
  _type: 'page',
  sections: [
    { _key: 'a', _type: 'heroSection', heading: 'One' },
    {
      _key: 'b',
      _type: 'railPanelsSection',
      heading: 'Two',
      panels: [
        { _key: 'p1', _type: 'panel', title: 'First panel' },
        { _key: 'p2', _type: 'panel', title: 'Second panel' },
        { _key: 'p3', _type: 'panel', title: 'Third panel' },
      ],
    },
    { _key: 'c', _type: 'mediaSection', heading: 'Three' },
  ],
})

const SECTIONS = ['sections']
const PANELS = ['sections', { _key: 'b' }, 'panels']

/**
 * A minimal applier for the two ops these builders emit, so the ORDER a patch
 * list produces is asserted rather than reasoned about.
 *
 * It is deliberately not a general Sanity patch engine — it handles `truncate`
 * and `insert` and would throw on anything else, which is itself a check that
 * nothing here quietly starts emitting a whole-array `set`.
 */
function applyPatches(snapshot: object, patches: readonly NodePatch[]): Record<string, unknown> {
  const next = structuredClone(snapshot) as Record<string, unknown>

  for (const patch of patches) {
    let container: unknown = next
    for (const segment of patch.path) {
      container =
        typeof segment === 'object' && segment !== null && '_key' in segment
          ? (container as { _key: string }[]).find((entry) => entry._key === segment._key)
          : (container as Record<string, unknown>)[segment as string]
    }
    const array = container as { _key: string }[]
    const op = patch.op

    if (op.type === 'truncate') {
      array.splice(op.startIndex, (op.endIndex ?? array.length) - op.startIndex)
      continue
    }
    if (op.type === 'insert') {
      const reference = op.referenceItem
      const at =
        typeof reference === 'number'
          ? reference < 0
            ? array.length + reference
            : reference
          : array.findIndex((entry) => entry._key === (reference as { _key: string })._key)
      array.splice(op.position === 'before' ? at : at + 1, 0, ...(op.items as { _key: string }[]))
      continue
    }
    throw new Error(`applyPatches: unexpected op "${op.type}"`)
  }

  return next
}

const keysOf = (doc: Record<string, unknown>, at: 'sections' | 'panels'): string[] => {
  const sections = doc.sections as { _key: string; panels?: { _key: string }[] }[]
  const array = at === 'sections' ? sections : sections.find((s) => s._key === 'b')!.panels!
  return array.map((entry) => entry._key)
}

describe('duplicate', () => {
  it('inserts one copy immediately after the item, keyed by the item’s own key', () => {
    // The stock builder's shape exactly: one `insert`, `after`, referencing the
    // item by KEY rather than by index, so a concurrent insert earlier in the
    // array cannot land the copy beside the wrong thing.
    const patches = duplicateItemPatch(page(), 'sections[_key=="a"]')!
    expect(patches).toHaveLength(1)
    expect(patches[0]!.path).toEqual(SECTIONS)
    expect(patches[0]!.op).toMatchObject({
      type: 'insert',
      position: 'after',
      referenceItem: { _key: 'a' },
    })
  })

  it('gives the copy a fresh key in Sanity’s own charset and length', () => {
    // `randomKey(12)` — 12 characters from `crypto.getRandomValues`, which is
    // what the Studio's array input emits sixteen times over. A `_key` is in
    // every GROQ path and every `data-sanity` attribute, so a differently
    // shaped one would work and would still look wrong beside its siblings.
    const op = duplicateItemPatch(page(), 'sections[_key=="a"]')![0]!.op as {
      items: { _key: string }[]
    }
    const key = op.items[0]!._key
    expect(key).toMatch(/^[A-Za-z0-9]{12}$/)
    expect(key).not.toBe('a')
  })

  it('never repeats a key', () => {
    const keyOf = () => {
      const op = duplicateItemPatch(page(), 'sections[_key=="a"]')![0]!.op as {
        items: { _key: string }[]
      }
      return op.items[0]!._key
    }
    expect(new Set([keyOf(), keyOf(), keyOf(), keyOf()]).size).toBe(4)
  })

  it('copies every other field, and lands the copy in the next slot', () => {
    const applied = applyPatches(page(), duplicateItemPatch(page(), 'sections[_key=="a"]')!)
    const sections = applied.sections as { _key: string; _type: string; heading: string }[]
    expect(sections).toHaveLength(4)
    expect(sections[1]).toMatchObject({ _type: 'heroSection', heading: 'One' })
    expect(sections[1]!._key).not.toBe('a')
    expect(keysOf(applied, 'sections')[0]).toBe('a')
    expect(keysOf(applied, 'sections')[2]).toBe('b')
  })

  it('duplicates a keyed item inside a block against that block’s own array', () => {
    // The same builder, one level down. Nothing about it knows a panel from a
    // section — the parent array is whatever the path says it is.
    const patches = duplicateItemPatch(page(), 'sections[_key=="b"].panels[_key=="p2"]')!
    expect(patches[0]!.path).toEqual(PANELS)
    expect(patches[0]!.op).toMatchObject({ position: 'after', referenceItem: { _key: 'p2' } })

    const applied = applyPatches(page(), patches)
    expect(keysOf(applied, 'panels').slice(0, 2)).toEqual(['p1', 'p2'])
    expect(keysOf(applied, 'panels')).toHaveLength(4)
    expect(keysOf(applied, 'panels')[3]).toBe('p3')
  })

  it('leaves nested children their own keys, because a key is unique per array', () => {
    // Shallow, with one field replaced — the stock builder's `{...item, _key}`.
    // A deep re-key would make the copy and the original incomparable
    // everywhere an editor might diff them, and it buys nothing: the copy's
    // `panels` is a different array from the original's.
    const op = duplicateItemPatch(page(), 'sections[_key=="b"]')![0]!.op as {
      items: { panels: { _key: string }[] }[]
    }
    expect(op.items[0]!.panels.map((panel) => panel._key)).toEqual(['p1', 'p2', 'p3'])
  })
})

describe('remove', () => {
  it('truncates the one index, and not by key', () => {
    // `truncate(i, i + 1)` is the op the stock menu emits and the op the
    // Studio's own array input emits. `remove({_key})` would do the same thing
    // and record a different history.
    const patches = removeItemPatch(page(), 'sections[_key=="b"]')!
    expect(patches).toEqual([
      { path: SECTIONS, op: { type: 'truncate', startIndex: 1, endIndex: 2 } },
    ])
  })

  it('takes out exactly that item', () => {
    const applied = applyPatches(page(), removeItemPatch(page(), 'sections[_key=="b"]')!)
    expect(keysOf(applied, 'sections')).toEqual(['a', 'c'])
  })

  it('removes a nested item against its own array', () => {
    const patches = removeItemPatch(page(), 'sections[_key=="b"].panels[_key=="p1"]')!
    expect(patches[0]!.path).toEqual(PANELS)
    expect(keysOf(applyPatches(page(), patches), 'panels')).toEqual(['p2', 'p3'])
  })

  it('empties an array of one, because the canvas does not enforce validation', () => {
    // `min(1)` and `min(2)` are Studio-side rules on the schema. Performing the
    // removal and letting the Studio flag the field is what the form already
    // does; refusing it here would mean the same item is removable from one
    // surface and not the other, and would trap an editor at exactly the count
    // where "remove and re-add" is the only way to fix a bad item.
    const one = { sections: [{ _key: 'only', _type: 'heroSection' }] }
    expect(applyPatches(one, removeItemPatch(one, 'sections[_key=="only"]')!).sections).toEqual([])
  })
})

describe('move', () => {
  const movedKeys = (itemPath: string, to: ItemMove, at: 'sections' | 'panels' = 'sections') =>
    keysOf(applyPatches(page(), moveItemPatch(page(), itemPath, to)!), at)

  it('takes the item out and puts it back, two patches, never one set', () => {
    // A whole-array `set` is one mutation claiming every item changed: two
    // editors reordering two different sections in the same second resolve as
    // one clobbering the other, and the history records a rewrite where a
    // reorder happened.
    const patches = moveItemPatch(page(), 'sections[_key=="c"]', 'first')!
    expect(patches).toEqual([
      { path: SECTIONS, op: { type: 'truncate', startIndex: 2, endIndex: 3 } },
      {
        path: SECTIONS,
        op: {
          type: 'insert',
          referenceItem: 0,
          position: 'before',
          items: [{ _key: 'c', _type: 'mediaSection', heading: 'Three' }],
        },
      },
    ])
  })

  it('indexes the second patch against the array as truncated', () => {
    // "Down" inserts AFTER the current index, which after the removal is the
    // slot the next item moved into. This is the off-by-one the patch object
    // cannot show, which is why it is asserted by applying.
    expect(movedKeys('sections[_key=="a"]', 'next')).toEqual(['b', 'a', 'c'])
    expect(movedKeys('sections[_key=="c"]', 'previous')).toEqual(['a', 'c', 'b'])
  })

  it('moves to either end', () => {
    expect(movedKeys('sections[_key=="c"]', 'first')).toEqual(['c', 'a', 'b'])
    expect(movedKeys('sections[_key=="a"]', 'last')).toEqual(['b', 'c', 'a'])
  })

  it('reaches the end from the middle with a negative reference', () => {
    // `-1` is the last element whatever the length turned out to be, so "to
    // bottom" needs no arithmetic against a length that the truncate changed.
    const patches = moveItemPatch(page(), 'sections[_key=="b"]', 'last')!
    expect(patches[1]!.op).toMatchObject({ referenceItem: -1, position: 'after' })
    expect(movedKeys('sections[_key=="b"]', 'last')).toEqual(['a', 'c', 'b'])
  })

  it('moves a nested item within its own array', () => {
    expect(movedKeys('sections[_key=="b"].panels[_key=="p3"]', 'first', 'panels')).toEqual([
      'p3',
      'p1',
      'p2',
    ])
    expect(movedKeys('sections[_key=="b"].panels[_key=="p1"]', 'next', 'panels')).toEqual([
      'p2',
      'p1',
      'p3',
    ])
  })

  it('is undefined at the top, for both rows that mean the same non-event', () => {
    expect(moveItemPatch(page(), 'sections[_key=="a"]', 'first')).toBeUndefined()
    expect(moveItemPatch(page(), 'sections[_key=="a"]', 'previous')).toBeUndefined()
  })

  it('is undefined at the bottom, for both rows that mean the same non-event', () => {
    expect(moveItemPatch(page(), 'sections[_key=="c"]', 'next')).toBeUndefined()
    expect(moveItemPatch(page(), 'sections[_key=="c"]', 'last')).toBeUndefined()
  })

  it('is undefined every way in an array of one, which is first and last at once', () => {
    const one = { sections: [{ _key: 'only', _type: 'heroSection' }] }
    for (const to of ['first', 'previous', 'next', 'last'] as const) {
      expect(moveItemPatch(one, 'sections[_key=="only"]', to), to).toBeUndefined()
    }
  })

  it('is defined every way from the middle', () => {
    for (const to of ['first', 'previous', 'next', 'last'] as const) {
      expect(moveItemPatch(page(), 'sections[_key=="b"]', to), to).toBeDefined()
    }
  })
})

describe('what no builder will do', () => {
  const every = (snapshot: unknown, path: string) => [
    duplicateItemPatch(snapshot, path),
    removeItemPatch(snapshot, path),
    ...(['first', 'previous', 'next', 'last'] as const).map((to) =>
      moveItemPatch(snapshot, path, to),
    ),
  ]

  it('resolves nothing before the draft snapshot has arrived', () => {
    // The first frame after a hover. The menu opens; these rows are simply not
    // in it, which is the honest answer while nothing can be located.
    for (const patches of every(undefined, 'sections[_key=="a"]')) {
      expect(patches).toBeUndefined()
    }
  })

  it('resolves nothing for an item the snapshot has not loaded', () => {
    // Also what a second editor removing it looks like from here.
    for (const patches of every(page(), 'sections[_key=="gone"]')) {
      expect(patches).toBeUndefined()
    }
  })

  it('resolves nothing for a path that is not an array item', () => {
    // A field under a block, and the container itself. Neither is a member of
    // anything, so there is no parent array to patch.
    for (const path of ['sections[_key=="a"].heading', 'sections', 'seo.title', '']) {
      for (const patches of every(page(), path)) {
        expect(patches, path).toBeUndefined()
      }
    }
  })

  it('resolves nothing when the parent is not an array', () => {
    // A keyed path whose prefix happens to be an object. Nothing in the schema
    // produces this, and the builders answer it rather than throwing into a
    // click handler.
    const odd = { seo: { title: 'Home' } }
    for (const patches of every(odd, 'seo[_key=="x"]')) {
      expect(patches).toBeUndefined()
    }
  })

  it('emits only truncate and insert, for every action and both levels', () => {
    // The guard behind "identical mutations": the moment one of these starts
    // emitting a `set` over the whole array, our menu and the stock menu stop
    // agreeing about what a reorder is.
    const paths = ['sections[_key=="b"]', 'sections[_key=="b"].panels[_key=="p2"]']
    for (const path of paths) {
      for (const patches of every(page(), path)) {
        for (const patch of patches ?? []) {
          expect(['truncate', 'insert'], `${path} ${patch.op.type}`).toContain(patch.op.type)
        }
      }
    }
  })
})

describe('which rows exist', () => {
  const rows = (snapshot: unknown, itemPath: string, subjectTitle?: string) =>
    itemActionGroups({ snapshot, itemPath, subjectTitle }).map((group) => ({
      id: group.id,
      title: group.title,
      label: group.label,
      actions: group.actions.map((action) => action.title),
    }))

  it('offers everything on an item with somewhere to go in both directions', () => {
    expect(rows(page(), 'sections[_key=="b"].panels[_key=="p2"]', 'Panel')).toEqual([
      { id: 'item', title: undefined, label: 'Panel', actions: ['Duplicate', 'Remove'] },
      { id: 'move', title: 'Move', label: 'Move', actions: ['To top', 'Up', 'Down', 'To bottom'] },
    ])
  })

  it('drops the move rows that would move nothing, and keeps the group', () => {
    expect(rows(page(), 'sections[_key=="a"]', 'Hero section')[1]).toMatchObject({
      actions: ['Down', 'To bottom'],
    })
    expect(rows(page(), 'sections[_key=="c"]', 'Media section')[1]).toMatchObject({
      actions: ['To top', 'Up'],
    })
  })

  it('drops the whole move group for an array of one, rather than emptying it', () => {
    // The no-dead-control rule: a group is absent, not empty. Duplicate and
    // Remove survive, because both still do something.
    const one = { sections: [{ _key: 'only', _type: 'heroSection' }] }
    expect(rows(one, 'sections[_key=="only"]', 'Hero section').map((g) => g.id)).toEqual(['item'])
  })

  it('offers no rows at all where nothing resolves', () => {
    expect(rows(undefined, 'sections[_key=="a"]')).toEqual([])
    expect(rows(page(), 'sections[_key=="a"].heading')).toEqual([])
  })

  it('treats a block and an item as the same kind of subject', () => {
    // One rule for what the subject is — `itemPath ?? blockPath` — and one set
    // of actions over it. A section in `page.sections` and a panel in
    // `railPanelsSection.panels` are both keyed members of an array.
    const block = rows(page(), 'sections[_key=="b"]', 'Rail panels section')
    const item = rows(page(), 'sections[_key=="b"].panels[_key=="p2"]', 'Panel')
    expect(block.map((g) => g.actions)).toEqual(item.map((g) => g.actions))
  })

  it('offers Remove on an array already at its declared minimum', () => {
    // `railPanelsSection.panels` declares `min(2)`. A control is dead when it
    // cannot change the document, not when it produces a document the Studio
    // will flag — and this module cannot see `validation` from where it stands
    // without importing the schema it is designed not to know.
    const two = {
      sections: [
        {
          _key: 'b',
          _type: 'railPanelsSection',
          panels: [
            { _key: 'p1', _type: 'panel' },
            { _key: 'p2', _type: 'panel' },
          ],
        },
      ],
    }
    expect(rows(two, 'sections[_key=="b"].panels[_key=="p1"]', 'Panel')[0]!.actions).toContain(
      'Remove',
    )
  })

  it('names the group for a screen reader even where the eye reads the header', () => {
    // Duplicate and Remove carry no visible heading — the menu header one line
    // above already names what Remove would remove — so the label is the only
    // thing that says it out loud.
    expect(rows(page(), 'sections[_key=="b"]', 'Rail panels section')[0]).toMatchObject({
      title: undefined,
      label: 'Rail panels section',
    })
    // And a last-resort label for the window before anything can name it.
    expect(rows(page(), 'sections[_key=="b"]')[0]).toMatchObject({ label: 'Item' })
  })

  it('carries the patches that decided the row exists', () => {
    // The row IS its mutation. There is no second list of conditions that could
    // drift from what the builders actually do.
    for (const group of itemActionGroups({
      snapshot: page(),
      itemPath: 'sections[_key=="b"]',
      subjectTitle: 'Rail panels section',
    })) {
      for (const action of group.actions) {
        expect(action.patches.length, action.id).toBeGreaterThan(0)
      }
    }
  })
})
