import { describe, expect, it } from 'vitest'

import {
  deepEqual,
  diffFields,
  driftBetween,
  resolveMarkers,
  stripSystem,
  type AnyDoc,
} from './core/drift'
import { productionGate } from './lib/prodGate'

describe('productionGate', () => {
  it('refuses a load into production without the flag', () => {
    expect(productionGate('production', ['node', 'load.ts'])).toMatch(/REFUSED/)
  })

  it('lets a load into production through with --allow-production', () => {
    expect(productionGate('production', ['node', 'load.ts', '--allow-production'])).toBeNull()
  })

  it('never gates a load into development', () => {
    expect(productionGate('development', ['node', 'load.ts'])).toBeNull()
  })
})

const ASSETS = {
  'https://old.site/a.jpg': { assetId: 'image-aaa' },
  'file:tools/migration/data/seed/assets/hero.png': { assetId: 'image-bbb' },
}

describe('resolveMarkers', () => {
  it('resolves a remote marker to the committed asset reference', () => {
    const node = { _type: 'image', _wpSrc: 'https://old.site/a.jpg', alt: 'a' }
    expect(resolveMarkers(node, ASSETS, new Set())).toEqual({
      _type: 'image',
      alt: 'a',
      asset: { _type: 'reference', _ref: 'image-aaa' },
    })
  })

  it('resolves a local marker through its file: key', () => {
    const node = { _type: 'image', _localSrc: 'tools/migration/data/seed/assets/hero.png' }
    expect(resolveMarkers(node, ASSETS, new Set())).toEqual({
      _type: 'image',
      asset: { _type: 'reference', _ref: 'image-bbb' },
    })
  })

  it('drops known-missing media, and a dropped image takes its figure', () => {
    const doc = {
      body: [
        { _type: 'figure', image: { _type: 'image', _wpSrc: 'https://old.site/gone.jpg' } },
        { _type: 'block', text: 'kept' },
      ],
    }
    expect(resolveMarkers(doc, ASSETS, new Set(['https://old.site/gone.jpg']))).toEqual({
      body: [{ _type: 'block', text: 'kept' }],
    })
  })

  it('leaves an unmapped marker in place so the document reads as differing', () => {
    const node = { _type: 'image', _wpSrc: 'https://old.site/new.jpg' }
    expect(resolveMarkers(node, ASSETS, new Set())).toEqual(node)
  })
})

describe('deepEqual and diffFields', () => {
  it('treats an absent key and an undefined value as the same', () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(true)
  })

  it('names the top-level fields that differ, ignoring system keys', () => {
    const expected = { _id: 'x', _type: 't', title: 'Ours', body: [1] } as AnyDoc
    const live = { _id: 'x', _type: 't', title: 'Theirs', body: [1], _rev: 'r' } as AnyDoc
    expect(diffFields(stripSystem(expected), stripSystem(live))).toEqual(['title'])
  })

  /**
   * A deprecated field the dataset still holds and the corpus has already
   * dropped is not an editor's work. One deprecation would otherwise put a
   * line in the report for every document of its type (#418).
   */
  it('ignores a field the corpus deliberately no longer claims', () => {
    const expected = { _id: 'insight-wp-1', _type: 'insight', cardMedia: { alt: 'a' } } as AnyDoc
    const live = {
      _id: 'insight-wp-1',
      _type: 'insight',
      cardMedia: { alt: 'a' },
      featuredImage: { alt: 'a' },
    } as AnyDoc
    expect(diffFields(stripSystem(expected), stripSystem(live))).toEqual([])
  })

  it('still names it on a type that never deprecated it', () => {
    const expected = { _id: 'page-seed-index', _type: 'page' } as AnyDoc
    const live = { _id: 'page-seed-index', _type: 'page', featuredImage: { alt: 'a' } } as AnyDoc
    expect(diffFields(stripSystem(expected), stripSystem(live))).toEqual(['featuredImage'])
  })
})

describe('driftBetween', () => {
  const committed: AnyDoc = { _id: 'page-seed-index', _type: 'page', title: 'Home' }

  it('reports a published edit with the fields that changed', () => {
    const live: AnyDoc = { _id: 'page-seed-index', _type: 'page', title: 'Home!', _rev: 'r' }
    expect(driftBetween([committed], [live], {}, new Set())).toEqual([
      { id: 'page-seed-index', fields: ['title'], draft: false },
    ])
  })

  it('reports a shadowing draft even when the published copy matches', () => {
    const published: AnyDoc = { _id: 'page-seed-index', _type: 'page', title: 'Home', _rev: 'r' }
    const draft: AnyDoc = { _id: 'drafts.page-seed-index', _type: 'page', title: 'WIP' }
    expect(driftBetween([committed], [published, draft], {}, new Set())).toEqual([
      { id: 'page-seed-index', fields: [], draft: true },
    ])
  })

  it('says nothing about a document nobody has loaded yet', () => {
    expect(driftBetween([committed], [], {}, new Set())).toEqual([])
  })
})
