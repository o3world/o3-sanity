import { defineObjectKnobs, knob } from '@o3/block-spec'
import { describe, expect, it } from 'vitest'

import { nearestInstance } from './instance'

const markKnobs = defineObjectKnobs({
  type: 'mark',
  title: 'Mark',
  knobs: [knob({ name: 'kind', title: 'Kind', options: ['orb', 'disc'] })],
})
const OBJECT_KNOBS = { mark: markKnobs }

/**
 * The snapshot the walk reads `_type` out of. Written as a path → type map
 * rather than a document, because the walk only ever asks that one question and
 * a fake document would put the answer three parses away from the assertion.
 */
const typesAt = (types: Record<string, string>) => (path: string) => types[path]

const BLOCK = 'sections[_key=="a"]'

describe('the nearest enclosing instance', () => {
  it('walks outward from a leaf to the object that has a declaration', () => {
    // The hover lands on a field inside the mark, which is what an
    // innermost-wins overlay hands you.
    expect(
      nearestInstance({
        path: `${BLOCK}.panels[_key=="p"].mark.kind`,
        blockPath: BLOCK,
        typeAt: typesAt({ [`${BLOCK}.panels[_key=="p"].mark`]: 'mark' }),
        objectKnobs: OBJECT_KNOBS,
      }),
    ).toEqual({ path: `${BLOCK}.panels[_key=="p"].mark`, spec: markKnobs })
  })

  it('answers for the instance itself when the instance is what is hovered', () => {
    expect(
      nearestInstance({
        path: `${BLOCK}.mark`,
        blockPath: BLOCK,
        typeAt: typesAt({ [`${BLOCK}.mark`]: 'mark' }),
        objectKnobs: OBJECT_KNOBS,
      })?.path,
    ).toBe(`${BLOCK}.mark`)
  })

  it('reaches a keyed member whose own type is a shared object', () => {
    // A mark in a layout column is an array member AND an instance. It is
    // keyed, not named, so a walk that only looked at field segments would miss
    // exactly the placement ADR 0023 was written to reach.
    expect(
      nearestInstance({
        path: `${BLOCK}.items[_key=="m"]`,
        blockPath: BLOCK,
        typeAt: typesAt({ [`${BLOCK}.items[_key=="m"]`]: 'mark' }),
        objectKnobs: OBJECT_KNOBS,
      })?.spec,
    ).toBe(markKnobs)
  })

  it('takes the INNERMOST declared object, not the outermost', () => {
    // Nothing nests an instance in an instance today. The rule is stated
    // anyway, because "nearest enclosing" is the whole sentence and an outward
    // walk that did not stop would attach the wrong roster to the right element.
    expect(
      nearestInstance({
        path: `${BLOCK}.mark.inner.kind`,
        blockPath: BLOCK,
        typeAt: typesAt({ [`${BLOCK}.mark`]: 'mark', [`${BLOCK}.mark.inner`]: 'mark' }),
        objectKnobs: OBJECT_KNOBS,
      })?.path,
    ).toBe(`${BLOCK}.mark.inner`)
  })

  it('stops at the block, which is a component of another kind', () => {
    // The block root is `BLOCK_KNOBS`' business. Walking past it would let a
    // shared object that doubles as a base block answer for the band it is
    // standing in.
    expect(
      nearestInstance({
        path: `${BLOCK}.heading`,
        blockPath: BLOCK,
        typeAt: typesAt({ [BLOCK]: 'mark' }),
        objectKnobs: OBJECT_KNOBS,
      }),
    ).toBeUndefined()
  })

  it('answers nothing for an object that declares no knobs', () => {
    // A `figure` has editorial fields and no design options, so there is no
    // menu to open. Absence here is a real answer, not a missing conversion.
    expect(
      nearestInstance({
        path: `${BLOCK}.media.alt`,
        blockPath: BLOCK,
        typeAt: typesAt({ [`${BLOCK}.media`]: 'figure' }),
        objectKnobs: OBJECT_KNOBS,
      }),
    ).toBeUndefined()
  })

  it('is own-property guarded, because the type comes from a document', () => {
    expect(
      nearestInstance({
        path: `${BLOCK}.thing`,
        blockPath: BLOCK,
        typeAt: typesAt({ [`${BLOCK}.thing`]: 'constructor' }),
        objectKnobs: OBJECT_KNOBS,
      }),
    ).toBeUndefined()
  })

  it('answers nothing before the draft snapshot has settled', () => {
    expect(
      nearestInstance({
        path: `${BLOCK}.mark.kind`,
        blockPath: BLOCK,
        typeAt: () => undefined,
        objectKnobs: OBJECT_KNOBS,
      }),
    ).toBeUndefined()
  })
})
