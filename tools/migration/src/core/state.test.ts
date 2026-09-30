import { describe, expect, it } from 'vitest'

import {
  isLocked,
  isProvisional,
  lockedIds,
  migrationObject,
  provisionalNote,
  slugCollisions,
  slugRowsOf,
} from './state'

/**
 * The lock rule (ADR 0003) is what stops `sync-docs` replacing editor-owned
 * content and what `drift` counts as already safe. A lock on either copy locks
 * the document, so these pin that a locked DRAFT reads as locked.
 */
describe('the locked predicate', () => {
  it('reads a locked draft as locked, under the id of the document it shadows', () => {
    expect(lockedIds([{ _id: 'drafts.page-seed-index', locked: true }])).toEqual(
      new Set(['page-seed-index']),
    )
  })

  it('reads a locked published document as locked', () => {
    expect(lockedIds([{ _id: 'insight-wp-1', locked: true }])).toEqual(new Set(['insight-wp-1']))
  })

  it('leaves an unlocked or unstamped document out', () => {
    expect(
      lockedIds([
        { _id: 'insight-wp-1', locked: false },
        { _id: 'insight-wp-2', locked: null },
        { _id: 'drafts.insight-wp-3', locked: false },
      ]),
    ).toEqual(new Set())
  })

  it('is true only for an explicit lock', () => {
    expect(isLocked({ _id: 'insight-wp-1', locked: true })).toBe(true)
    expect(isLocked({ _id: 'insight-wp-1', locked: false })).toBe(false)
    expect(isLocked({ _id: 'insight-wp-1', locked: null })).toBe(false)
  })
})

/**
 * Routes resolve a document with `…[0]`, so two documents claiming one slug
 * make the served page a coin flip — which is how a leftover `page-home`
 * shadowed the homepage seed and served two sections instead of eight.
 * `verify` checks for them from whole documents; these pin the answer it gets.
 */
describe('slug collisions', () => {
  it('names both documents claiming one type and slug', () => {
    expect(
      slugCollisions([
        { _id: 'page-home', _type: 'page', slug: 'index' },
        { _id: 'page-seed-index', _type: 'page', slug: 'index' },
      ]),
    ).toEqual([{ key: 'page:index', ids: ['page-home', 'page-seed-index'] }])
  })

  it('reports two documents claiming one empty slug', () => {
    expect(
      slugCollisions([
        { _id: 'page-wp-1', _type: 'page', slug: '' },
        { _id: 'page-wp-2', _type: 'page', slug: '' },
      ]),
    ).toEqual([{ key: 'page:', ids: ['page-wp-1', 'page-wp-2'] }])
  })

  it('leaves one slug claimed once alone, under any number of types', () => {
    expect(
      slugCollisions([
        { _id: 'page-seed-about', _type: 'page', slug: 'about' },
        { _id: 'insight-wp-1', _type: 'insight', slug: 'about' },
      ]),
    ).toEqual([])
  })

  it('finds the same collision in whole documents as in projected rows', () => {
    const docs = [
      { _id: 'page-home', _type: 'page', slug: { _type: 'slug', current: 'index' } },
      { _id: 'page-seed-index', _type: 'page', slug: { _type: 'slug', current: 'index' } },
    ]
    expect(slugCollisions(slugRowsOf(docs))).toEqual([
      { key: 'page:index', ids: ['page-home', 'page-seed-index'] },
    ])
  })

  it('reads only routable documents that have a slug', () => {
    expect(
      slugRowsOf([
        { _id: 'person-wp-1', _type: 'person', slug: { _type: 'slug', current: 'nick' } },
        { _id: 'page-seed-index', _type: 'page' },
        { _id: 'insight-wp-1', _type: 'insight', slug: { _type: 'slug', current: 'a-post' } },
      ]),
    ).toEqual([{ _id: 'insight-wp-1', _type: 'insight', slug: 'a-post' }])
  })
})

/**
 * Provisional content (#40, ADR 0007) is how a route resolves before its real
 * content exists. Never a finding — it is a count `verify` says out loud every
 * run, because the failure it prevents is a placeholder nobody came back to
 * reaching a reader.
 */
describe('the provisional predicate', () => {
  it('is true only for a document stamped provisional', () => {
    expect(isProvisional({ migration: { provisional: true } })).toBe(true)
    expect(isProvisional({ migration: { provisional: false } })).toBe(false)
    expect(isProvisional({ migration: { locked: false, sourceId: 'wp:post:1' } })).toBe(false)
    expect(isProvisional({})).toBe(false)
  })

  it('reads the note that says what is still missing', () => {
    expect(
      provisionalNote({ migration: { provisional: true, provisionalNote: 'copy pending' } }),
    ).toBe('copy pending')
    expect(provisionalNote({ migration: { provisional: true } })).toBeUndefined()
    expect(provisionalNote({})).toBeUndefined()
  })
})

/**
 * The `migration` object every pipeline-owned document carries. One fragment,
 * because the six mappers that restate it are six chances for the field the
 * lock rule reads to be optional in one of them.
 */
describe('the shared migration fragment', () => {
  it('takes a stamped document', () => {
    expect(migrationObject.safeParse({ locked: false, sourceId: 'wp:post:1' }).success).toBe(true)
  })

  it('refuses a document with no lock flag or no source', () => {
    expect(migrationObject.safeParse({ sourceId: 'wp:post:1' }).success).toBe(false)
    expect(migrationObject.safeParse({ locked: false }).success).toBe(false)
  })

  it("takes a locked document — the flag is an editor's to set", () => {
    expect(migrationObject.safeParse({ locked: true, sourceId: 'wp:post:1' }).success).toBe(true)
  })
})
