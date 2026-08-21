import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { corpusPath, readCorpus, readTree, slugsByType } from './read'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__')

describe('readTree', () => {
  it('returns every JSON document with the tree, type and file it came from', () => {
    expect(readTree('converted', join(FIXTURES, 'corpus', 'converted'))).toEqual([
      {
        tree: 'converted',
        type: 'insight',
        file: 'first-post.json',
        document: { _id: 'insight-wp-1', _type: 'insight', slug: { current: 'first-post' } },
      },
      {
        tree: 'converted',
        type: 'insight',
        file: 'second-post.json',
        document: { _id: 'insight-wp-2', _type: 'insight', slug: { current: 'second-post' } },
      },
      {
        tree: 'converted',
        type: 'page',
        file: 'about.json',
        document: { _id: 'page-wp-9', _type: 'page', slug: { current: 'about' } },
      },
    ])
  })

  /**
   * Git does not track an empty directory, so a tree whose last document was
   * deleted is not in the checkout at all — and that is exactly the run that
   * has to retire what the tree used to hold. An absent tree is a tree of no
   * documents rather than a crash.
   */
  it('reads a tree that is not in the checkout as no documents at all', () => {
    expect(readTree('translated', join(FIXTURES, 'corpus', 'nothing-committed'))).toEqual([])
  })

  // A file where a type directory would be — a `.DS_Store`, a stray manifest —
  // is not a type, and the reader must not take the whole load down over one.
  it('skips a file sitting where a type directory would be', () => {
    expect(readTree('seed', join(FIXTURES, 'stray')).map((entry) => entry.type)).toEqual(['page'])
  })
})

/** The trees each entry came from, in the order the reader returned them. */
function treesRead(entries: readonly { tree: string }[]): string[] {
  return [...new Set(entries.map((entry) => entry.tree))]
}

describe('readCorpus', () => {
  it('reads the committed trees in load order', () => {
    const trees = treesRead(readCorpus())
    expect(trees.length).toBeGreaterThan(0)
    // Load order, tolerating a tree with nothing committed — git drops an
    // empty directory, and an absent tree is a legal state of the corpus.
    expect(trees).toEqual(['converted', 'seed', 'translated'].filter((t) => trees.includes(t)))
  })

  // Not every consumer speaks for the whole corpus: a translated document's
  // references resolve against the two trees written before it.
  it('reads only the trees it was asked for', () => {
    expect(treesRead(readCorpus('converted', 'seed'))).toEqual(['converted', 'seed'])
  })
})

describe('corpusPath', () => {
  // A finding names the file to open, and the tree is half of that: three
  // trees can hold a `page/about.json` each.
  it('names the file a finding is about', () => {
    expect(corpusPath({ tree: 'seed', type: 'page', file: 'about.json' })).toBe(
      'seed/page/about.json',
    )
  })
})

describe('slugsByType', () => {
  /**
   * The input to `sitePaths`, which is the set of URLs the new site serves. It
   * groups by the document's own `_type` rather than by the directory holding
   * it, and a document with no slug serves no URL.
   */
  it('groups the slugs a type serves and ignores a document that serves none', () => {
    const entries = [
      {
        tree: 'converted',
        type: 'page',
        file: 'about.json',
        document: { _id: 'a', _type: 'page', slug: { current: 'about' } },
      },
      {
        tree: 'seed',
        type: 'page',
        file: 'contact.json',
        document: { _id: 'b', _type: 'page', slug: { current: 'contact' } },
      },
      {
        tree: 'converted',
        type: 'insight',
        file: 'first.json',
        document: { _id: 'c', _type: 'insight', slug: { current: 'first' } },
      },
      {
        tree: 'converted',
        type: 'siteSettings',
        file: 'siteSettings.json',
        document: { _id: 'siteSettings', _type: 'siteSettings' },
      },
    ]
    expect(slugsByType(entries)).toEqual({
      page: ['about', 'contact'],
      insight: ['first'],
    })
  })
})
