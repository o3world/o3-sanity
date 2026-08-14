import { describe, expect, it } from 'vitest'

import { knobPatch } from './knobPatch'

const BLOCK = 'sections[_key=="abc"]'

describe('writing a knob value into the draft', () => {
  it('emits one set, and no guard, for a field at the block root', () => {
    expect(knobPatch(BLOCK, 'variant', 'band')).toEqual([
      { path: ['sections', { _key: 'abc' }, 'variant'], op: { type: 'set', value: 'band' } },
    ])
  })

  it('creates every intermediate object before writing a nested field', () => {
    // The bug this exists for: a bare `set` at `…media.ratio` against a block
    // with no `media` applies to nothing, the block comes back byte-identical,
    // and the failed apply can stop the document's mutator actor for good.
    expect(knobPatch(BLOCK, 'media.ratio', 'wide')).toEqual([
      { path: ['sections', { _key: 'abc' }, 'media'], op: { type: 'setIfMissing', value: {} } },
      {
        path: ['sections', { _key: 'abc' }, 'media', 'ratio'],
        op: { type: 'set', value: 'wide' },
      },
    ])
  })

  it('guards every level of a deep path, outermost first', () => {
    const patches = knobPatch(BLOCK, 'a.b.c.d', 'x')
    expect(patches.map((patch) => patch.path.slice(2))).toEqual([
      ['a'],
      ['a', 'b'],
      ['a', 'b', 'c'],
      ['a', 'b', 'c', 'd'],
    ])
    expect(patches.map((patch) => patch.op.type)).toEqual([
      'setIfMissing',
      'setIfMissing',
      'setIfMissing',
      'set',
    ])
  })

  it('never guards the block itself — the pointer is on it, so it exists', () => {
    // A `setIfMissing({})` at a keyed array item is a guard for a state that
    // cannot happen, aimed at a path shape that does not take one.
    const guards = knobPatch(BLOCK, 'media.ratio', 'wide').filter(
      (patch) => patch.op.type === 'setIfMissing',
    )
    expect(guards.map((patch) => patch.path)).not.toContainEqual(['sections', { _key: 'abc' }])
  })

  it('keeps the keyed segment as a path element rather than a string', () => {
    // `@sanity/mutate` matches an array member by `{_key}`; the literal
    // `sections[_key=="abc"]` as a property name would match no field at all.
    const [patch] = knobPatch(BLOCK, 'variant', 'band')
    expect(patch!.path[1]).toEqual({ _key: 'abc' })
  })

  it('writes inside a nested block, at the innermost keyed item', () => {
    const [patch] = knobPatch('sections[_key=="a"].items[_key=="b"]', 'variant', 'band')
    expect(patch!.path).toEqual(['sections', { _key: 'a' }, 'items', { _key: 'b' }, 'variant'])
  })

  it('refuses a block path it cannot resolve rather than patching the document root', () => {
    // Silently dropping the unresolvable prefix would `set` at `variant` on the
    // page itself.
    expect(() => knobPatch('sections[0]', 'variant', 'band')).toThrow(/resolvable block path/)
  })

  it('refuses an empty field path rather than replacing the block with a string', () => {
    expect(() => knobPatch(BLOCK, '', 'band')).toThrow(/field path/)
    expect(() => knobPatch(BLOCK, 'media.', 'band')).toThrow(/field path/)
  })

  it('writes a number unchanged, for a knob whose field is not a string (#123)', () => {
    // `layoutSection.columns` is `type: 'number'` holding `1 | 2 | 3`. The
    // caller converts through `storedValue`; this asserts the patch does not
    // stringify it back on the way out. Sanity's mutation API does not
    // typecheck, so a string here is written and never rejected — the page
    // still renders (the renderer coerces) while the document violates its own
    // schema and the Studio's number radio shows nothing selected.
    const [patch] = knobPatch(BLOCK, 'columns', 2)
    expect(patch!.op).toEqual({ type: 'set', value: 2 })
    expect(typeof (patch!.op as { value: unknown }).value).toBe('number')
  })
})
