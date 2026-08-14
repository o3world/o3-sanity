import { describe, expect, it } from 'vitest'

import { canvasSubject } from './subject'

/**
 * The paths below are the ones #107 actually stamps, in GROQ form. The
 * attribute writes them compactly (`sections:abc`), but Presentation hands the
 * resolver the expanded form, which is what this reads.
 */
describe('canvasSubject', () => {
  it('names the band when the band itself is hovered', () => {
    expect(canvasSubject('sections[_key=="abc"]')).toEqual({
      level: 'band',
      blockPath: 'sections[_key=="abc"]',
      nested: false,
    })
  })

  it('treats the header as a field of its block', () => {
    // #107 attributes the header at `.heading` — there is no `header` object
    // in the schema, and a path the schema cannot resolve fails silently.
    expect(canvasSubject('sections[_key=="abc"].heading')).toEqual({
      level: 'field',
      blockPath: 'sections[_key=="abc"]',
      nested: false,
    })
  })

  it('names the item when a keyed item sits between the cursor and the block', () => {
    expect(canvasSubject('sections[_key=="abc"].panels[_key=="p1"]')).toEqual({
      level: 'item',
      blockPath: 'sections[_key=="abc"]',
      itemPath: 'sections[_key=="abc"].panels[_key=="p1"]',
      nested: false,
    })
  })

  it('a stega’d leaf inside an item still names the item', () => {
    // Presentation's hover model is innermost-wins, so most hovers land on a
    // run of text rather than on the element the editor thinks they are on.
    expect(canvasSubject('sections[_key=="abc"].panels[_key=="p1"].heading')).toEqual({
      level: 'item',
      blockPath: 'sections[_key=="abc"]',
      itemPath: 'sections[_key=="abc"].panels[_key=="p1"]',
      nested: false,
    })
  })

  it('does not attach to the sections container or a plain document field', () => {
    // The container is Presentation's own reorder target, and `seo.title` is
    // not on the canvas at all.
    expect(canvasSubject('sections')).toBeUndefined()
    expect(canvasSubject('seo.title')).toBeUndefined()
    expect(canvasSubject('')).toBeUndefined()
  })

  it('works the same in a case study’s story array', () => {
    expect(canvasSubject('story[_key=="c1"].body')).toMatchObject({
      level: 'field',
      blockPath: 'story[_key=="c1"]',
    })
  })

  it('flags a block nested in another block’s array', () => {
    // Nothing produces this today — layoutSection.items is unattributed until
    // #115 — but the band is still the outer item, not the inner one.
    expect(canvasSubject('sections[_key=="abc"].items[_key=="x"]')).toEqual({
      level: 'item',
      blockPath: 'sections[_key=="abc"]',
      itemPath: 'sections[_key=="abc"].items[_key=="x"]',
      nested: false,
    })
  })

  // The cold-start property the prior art's block-reference cache lacked: a
  // pointer parked on a panel after a scroll or a navigation resolves without
  // the band ever having been hovered.
  it('resolves an inner path with no prior hover on the band', () => {
    expect(canvasSubject('sections[_key=="abc"].panels[_key=="p1"].body')?.blockPath).toBe(
      'sections[_key=="abc"]',
    )
  })
})
