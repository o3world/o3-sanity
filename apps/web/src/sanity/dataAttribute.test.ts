import { describe, expect, it } from 'vitest'

import {
  arrayItemLoc,
  dataAttr,
  fieldAttr,
  fieldLoc,
  itemAttr,
  rootFieldLoc,
} from './dataAttribute'

/**
 * The path builders behind sub-block `data-sanity` (#107).
 *
 * These are the whole of the nesting logic. Presentation resolves the path
 * against the schema, so a path that is one segment wrong resolves to nothing
 * — and it fails **silently** (#104): the overlay returns an undefined
 * resolver context and never calls the component resolver, with no console
 * warning. There is no runtime signal to debug from, which is why the rule
 * lives here, in a pure function with tests, rather than in a resolver.
 */

const doc = { id: 'page-1', type: 'page' }
/** One section of the page — the path the dispatch seam stamps on the band. */
const BAND = 'sections[_key=="aaa"]'

describe('fieldLoc', () => {
  it('appends a field to its parent path', () => {
    expect(fieldLoc(doc, BAND, 'heading').path).toBe('sections[_key=="aaa"].heading')
  })

  it('carries the document identity through', () => {
    expect(fieldLoc(doc, BAND, 'heading')).toMatchObject({ id: 'page-1', type: 'page' })
  })

  it('is the root field when there is no parent path', () => {
    expect(fieldLoc(doc, '', 'sections').path).toBe('sections')
    expect(rootFieldLoc(doc, 'sections').path).toBe('sections')
  })

  /**
   * The trap vtx-web's resolver hit: a portable-text field is also called
   * `content`, so a path can contain several prefixes that *look* like a
   * block root. Composition from the parent path is what makes that a
   * non-question — the builder never pattern-matches a segment name, so a
   * field sharing a name with the root array is just a field.
   */
  it('does not confuse a field named after the root array', () => {
    expect(fieldLoc(doc, BAND, 'sections').path).toBe('sections[_key=="aaa"].sections')
  })

  it('rejects a field name that is not a plain identifier', () => {
    expect(() => fieldLoc(doc, BAND, 'heading"]')).toThrow(/Unsafe field/)
  })
})

describe('arrayItemLoc', () => {
  it('filters an array by _key', () => {
    expect(arrayItemLoc(doc, 'sections', 'aaa').path).toBe('sections[_key=="aaa"]')
  })

  it('composes onto a nested array path', () => {
    const panels = fieldLoc(doc, BAND, 'panels')
    expect(arrayItemLoc(panels, panels.path, 'bbb').path).toBe(
      'sections[_key=="aaa"].panels[_key=="bbb"]',
    )
  })

  /**
   * Three levels deep — `statGroup.stats` inside a `layoutSection` column.
   * The builder composes there; the overlay cannot attach there yet (#115,
   * a polymorphic array at depth ≥ 2), which is why nothing renders this
   * path today. The rule is proven here so #115 is only an upstream fix.
   */
  it('composes to arbitrary depth', () => {
    const item = arrayItemLoc(doc, `${BAND}.items`, 'bbb')
    const stats = fieldLoc(item, item.path, 'stats')
    expect(arrayItemLoc(stats, stats.path, 'ccc').path).toBe(
      'sections[_key=="aaa"].items[_key=="bbb"].stats[_key=="ccc"]',
    )
  })

  /**
   * Defense in depth. `_key` is a `string` on a typed React tree and nothing
   * in the type system stops tainted data reaching it; a `"` would close the
   * GROQ string and inject path syntax into the resolver.
   */
  it.each([['a"b'], ['a]b'], ['a.b'], ['']])('rejects the unsafe _key %j', (key) => {
    expect(() => arrayItemLoc(doc, 'sections', key)).toThrow(/Unsafe _key/)
  })
})

describe('fieldAttr / itemAttr', () => {
  it('build the attribute for a child of a block location', () => {
    const loc = arrayItemLoc(doc, 'sections', 'aaa')
    // The attribute encodes `[_key=="x"]` as `:x`.
    expect(fieldAttr(loc, 'heading')).toContain('path=sections:aaa.heading')
    expect(itemAttr(loc, 'panels', 'bbb')).toContain('path=sections:aaa.panels:bbb')
  })

  /**
   * A block rendered outside a document — Storybook, a story-driven render
   * test — gets no location, and every call site would otherwise repeat the
   * same guard. Undefined in, undefined out: React drops the attribute.
   */
  it('are undefined without a location or a key', () => {
    expect(fieldAttr(undefined, 'heading')).toBeUndefined()
    expect(itemAttr(undefined, 'panels', 'bbb')).toBeUndefined()
    expect(itemAttr(arrayItemLoc(doc, 'sections', 'aaa'), 'panels', undefined)).toBeUndefined()
  })
})

describe('dataAttr', () => {
  it('points Open in Studio at the embedded Studio, not the site root', () => {
    expect(dataAttr(rootFieldLoc(doc, 'sections'))).toBe(
      'id=page-1;type=page;path=sections;base=%2Fstudio',
    )
  })
})
