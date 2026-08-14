import { describe, expect, it } from 'vitest'

import {
  arrayHostParts,
  blockRootPath,
  isNestedBlockGroqPath,
  itemArrayField,
  keyedItemParts,
  nearestArrayItemPath,
  parseGroqPath,
  resolveGroqPath,
} from './groqPath'

describe('parseGroqPath', () => {
  it('parses keyed segments', () => {
    expect(parseGroqPath('sections[_key=="a"].panels[_key=="b"].heading')).toEqual([
      'sections',
      { _key: 'a' },
      'panels',
      { _key: 'b' },
      'heading',
    ])
  })

  it('returns [] on syntax it does not understand', () => {
    // A numeric index is what Presentation emits for an unkeyed array. Nothing
    // downstream can resolve it, and half a path is worse than none.
    expect(parseGroqPath('sections[0].heading')).toEqual([])
  })

  it('parses the empty path as no segments', () => {
    expect(parseGroqPath('')).toEqual([])
  })
})

describe('resolveGroqPath', () => {
  const doc = {
    _type: 'page',
    sections: [
      { _key: 'a', _type: 'railPanelsSection', panels: [{ _key: 'p1', _type: 'panel' }] },
      { _key: 'b', _type: 'heroSection', heading: 'Hello' },
    ],
  }

  it('resolves nested keyed paths', () => {
    expect(resolveGroqPath(doc, 'sections[_key=="a"]._type')).toBe('railPanelsSection')
    expect(resolveGroqPath(doc, 'sections[_key=="a"].panels[_key=="p1"]._type')).toBe('panel')
    expect(resolveGroqPath(doc, 'sections[_key=="b"].heading')).toBe('Hello')
  })

  it('fails soft on a miss, at every level', () => {
    expect(resolveGroqPath(doc, 'sections[_key=="zz"]._type')).toBeUndefined()
    expect(resolveGroqPath(doc, 'sections[_key=="b"].panels[_key=="p1"]')).toBeUndefined()
    // The toolbar mounts before the mutator machine has a snapshot, so an
    // undefined root is the ordinary first render, not an error.
    expect(resolveGroqPath(undefined, 'sections[_key=="a"]._type')).toBeUndefined()
  })

  // The failure this guards is not a miss, it is the OPPOSITE of a miss: an
  // unparseable path used to resolve to the whole document, and `typeAt` was one
  // `typeof === 'string'` check away from naming a component after it.
  it('an unparseable path is undefined, not the root', () => {
    expect(resolveGroqPath(doc, 'sections[0].heading')).toBeUndefined()
    expect(resolveGroqPath(doc, 'sections[0]')).toBeUndefined()
    expect(resolveGroqPath(doc, 'not a path at all')).toBeUndefined()
  })

  // The empty path still means the root — `parseGroqPath('')` returns an empty
  // list because there is nothing to walk, not because it failed.
  it('the empty path is the root', () => {
    expect(resolveGroqPath(doc, '')).toBe(doc)
  })
})

describe('nearestArrayItemPath', () => {
  it('a keyed path is its own nearest item', () => {
    expect(nearestArrayItemPath('sections[_key=="a"]')).toBe('sections[_key=="a"]')
    expect(nearestArrayItemPath('sections[_key=="a"].panels[_key=="b"]')).toBe(
      'sections[_key=="a"].panels[_key=="b"]',
    )
  })

  it('a field path resolves to the item enclosing it', () => {
    // A stega'd run of panel copy names the PANEL: the chip's subject is what
    // the editor is pointing at, not the leaf the browser happened to hover.
    expect(nearestArrayItemPath('sections[_key=="a"].panels[_key=="b"].heading')).toBe(
      'sections[_key=="a"].panels[_key=="b"]',
    )
    // The header (#107 attributes it at `.heading`) belongs to the band.
    expect(nearestArrayItemPath('sections[_key=="a"].heading')).toBe('sections[_key=="a"]')
  })

  it('unkeyed subtrees have none', () => {
    expect(nearestArrayItemPath('sections')).toBeUndefined()
    expect(nearestArrayItemPath('seo.title')).toBeUndefined()
  })
})

describe('blockRootPath', () => {
  it('a band is its own block root', () => {
    expect(blockRootPath('sections[_key=="a"]')).toBe('sections[_key=="a"]')
  })

  it('every path below a band resolves to it', () => {
    expect(blockRootPath('sections[_key=="a"].heading')).toBe('sections[_key=="a"]')
    expect(blockRootPath('sections[_key=="a"].panels[_key=="b"].heading')).toBe(
      'sections[_key=="a"]',
    )
  })

  it('works for the other document array that hosts blocks', () => {
    // caseStudy.story interleaves chapters and section blocks (ADR 0018).
    expect(blockRootPath('story[_key=="c1"].body')).toBe('story[_key=="c1"]')
  })

  it('has none for the container or a plain document field', () => {
    // The `sections` array element itself is Presentation's reorder target,
    // not a block — nothing for this toolbar to name.
    expect(blockRootPath('sections')).toBeUndefined()
    expect(blockRootPath('seo.title')).toBeUndefined()
  })

  it('takes the outermost keyed segment, so nesting cannot move the band', () => {
    // What #115 will produce once layoutSection.items is attributable: the
    // enclosing BAND is still the outer item.
    expect(blockRootPath('sections[_key=="a"].items[_key=="x"].heading')).toBe(
      'sections[_key=="a"]',
    )
  })
})

describe('keyedItemParts', () => {
  it('splits an item into the array that holds it and its key', () => {
    expect(keyedItemParts('sections[_key=="a"]')).toEqual({ arrayPath: 'sections', key: 'a' })
  })

  it('takes the LAST keyed segment, so a nested item resolves against its own array', () => {
    // The array an item action patches is the one the item is a member of —
    // `panels`, not `sections`.
    expect(keyedItemParts('sections[_key=="a"].panels[_key=="b"]')).toEqual({
      arrayPath: 'sections[_key=="a"].panels',
      key: 'b',
    })
  })

  it('has no parts for anything that is not itself an array item', () => {
    // A field under a block, the container, a plain document field. None of
    // them is a member of anything, so there is no array to patch.
    expect(keyedItemParts('sections[_key=="a"].heading')).toBeUndefined()
    expect(keyedItemParts('sections')).toBeUndefined()
    expect(keyedItemParts('seo.title')).toBeUndefined()
    expect(keyedItemParts('')).toBeUndefined()
  })

  it('has no parts when the prefix is not a path we can resolve', () => {
    // An unresolvable array path would aim a truncate at the document root.
    expect(keyedItemParts('sections[0][_key=="a"]')).toBeUndefined()
  })
})

describe('which of the block\u2019s arrays the item sits in', () => {
  const BLOCK = 'sections[_key=="a"]'

  it('names the array a direct member sits in', () => {
    expect(itemArrayField(BLOCK, `${BLOCK}.panels[_key=="p"]`)).toBe('panels')
  })

  it('reaches an array nested in an object on the block', () => {
    expect(itemArrayField(BLOCK, `${BLOCK}.rail.panels[_key=="p"]`)).toBe('rail.panels')
  })

  it('says nothing for an item inside another item', () => {
    // A member of a member is a second root question. Answering `panels` here
    // would attach the outer array\u2019s spec to the inner member.
    expect(itemArrayField(BLOCK, `${BLOCK}.panels[_key=="p"].cards[_key=="c"]`)).toBeUndefined()
  })

  it('says nothing for the block itself, a plain field, or a foreign path', () => {
    expect(itemArrayField(BLOCK, BLOCK)).toBeUndefined()
    expect(itemArrayField(BLOCK, `${BLOCK}.heading`)).toBeUndefined()
    expect(itemArrayField(BLOCK, 'sections[_key=="b"].panels[_key=="p"]')).toBeUndefined()
  })
})

describe('where an array hangs', () => {
  it('reads a document-level array as a field of the document itself', () => {
    // The empty host path is the DOCUMENT, not "no host" — its `_type` is at
    // the root, which is what makes `page.sections` addressable by the same
    // rule as `railPanelsSection.panels`.
    expect(arrayHostParts('sections')).toEqual({ hostPath: '', field: 'sections' })
  })

  it('reads a nested array as a field of the block that holds it', () => {
    expect(arrayHostParts('sections[_key=="a"].panels')).toEqual({
      hostPath: 'sections[_key=="a"]',
      field: 'panels',
    })
  })

  it('reads an array on an object on a block', () => {
    expect(arrayHostParts('sections[_key=="a"].rail.panels')).toEqual({
      hostPath: 'sections[_key=="a"].rail',
      field: 'panels',
    })
  })

  it('says nothing for a path that does not end in a field', () => {
    // A `_key` may contain a dot, so the field half has to be a real
    // identifier at the very end or the split would land inside the key.
    expect(arrayHostParts('sections[_key=="a"]')).toBeUndefined()
    expect(arrayHostParts('sections[_key=="a.b"]')).toBeUndefined()
    expect(arrayHostParts('')).toBeUndefined()
  })
})

describe('isNestedBlockGroqPath', () => {
  it('a document-array block is not nested', () => {
    expect(isNestedBlockGroqPath('sections[_key=="a"]')).toBe(false)
    expect(isNestedBlockGroqPath('story[_key=="a"]')).toBe(false)
  })

  it('a block inside another block’s array is', () => {
    expect(isNestedBlockGroqPath('sections[_key=="a"].items[_key=="x"]')).toBe(true)
  })
})
