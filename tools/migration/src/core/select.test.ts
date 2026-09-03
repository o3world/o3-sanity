import { describe, expect, it } from 'vitest'

import { select, selectionKey, selectorFor } from './select'
import type { CorpusEntry } from './read'

const entry = (tree: string, type: string, file: string): CorpusEntry => ({
  tree,
  type,
  file,
  document: { _id: `${type}-seed-${file.replace('.json', '')}`, _type: type },
})

const corpus = [
  entry('seed', 'client', 'puma.json'),
  entry('seed', 'client', 'figma.json'),
  entry('seed', 'page', 'partners-sanity.json'),
  entry('seed', 'page', 'partners-vercel.json'),
  entry('converted', 'insight', 'a-post.json'),
]

describe('selectionKey', () => {
  it('is the type and file without the tree or the extension', () => {
    expect(selectionKey({ type: 'client', file: 'puma.json' })).toBe('client/puma')
  })
})

describe('selectorFor', () => {
  it('matches one document exactly', () => {
    expect(selectorFor('client/puma').test('client/puma')).toBe(true)
    expect(selectorFor('client/puma').test('client/puma-energy')).toBe(false)
  })

  it('accepts the filename with its extension, as tab completion produces it', () => {
    expect(selectorFor('client/puma.json').test('client/puma')).toBe(true)
  })

  it('confines a star to one segment, so a type cannot leak into another', () => {
    expect(selectorFor('client/*').test('client/puma')).toBe(true)
    expect(selectorFor('client/*').test('page/partners-sanity')).toBe(false)
  })

  it('treats a dot as a literal rather than as any character', () => {
    expect(selectorFor('client/a.b').test('client/axb')).toBe(false)
  })
})

describe('select', () => {
  it('collects every match across patterns', () => {
    const { matched } = select(corpus, ['client/*', 'page/partners-sanity'])
    expect(matched.map((e) => selectionKey(e)).sort()).toEqual([
      'client/figma',
      'client/puma',
      'page/partners-sanity',
    ])
  })

  it('names a document once however many patterns hit it', () => {
    const { matched } = select(corpus, ['client/*', 'client/puma'])
    expect(matched).toHaveLength(2)
  })

  it('reports a pattern that matched nothing, so a typo is not a silent no-op', () => {
    const { matched, empty } = select(corpus, ['client/*', 'client/pumma'])
    expect(empty).toEqual(['client/pumma'])
    expect(matched).toHaveLength(2)
  })

  it('selects across trees, because a pattern names a type and a file', () => {
    expect(select(corpus, ['insight/a-post']).matched).toHaveLength(1)
  })
})
