import { describe, expect, it } from 'vitest'

import {
  blockRootPath,
  isNestedBlockGroqPath,
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

describe('isNestedBlockGroqPath', () => {
  it('a document-array block is not nested', () => {
    expect(isNestedBlockGroqPath('sections[_key=="a"]')).toBe(false)
    expect(isNestedBlockGroqPath('story[_key=="a"]')).toBe(false)
  })

  it('a block inside another block’s array is', () => {
    expect(isNestedBlockGroqPath('sections[_key=="a"].items[_key=="x"]')).toBe(true)
  })
})
