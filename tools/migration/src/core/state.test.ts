import { describe, expect, it } from 'vitest'

import {
  LOCKED_BY_ID,
  LOCKED_BY_TYPE,
  LOCK_FETCH_OPTIONS,
  ROUTABLE_SLUGS,
  describeSlugCollision,
  isLocked,
  isProvisional,
  lockedIds,
  provisionalNote,
  slugCollisions,
  slugRowsOf,
} from './state'

/**
 * The lock rule (ADR 0003) is what stops the loader deleting editor-owned
 * content, and it has already been half a rule once: read through the default
 * published perspective, a locked DRAFT came back unlocked and got
 * overwritten. These pin both halves — the query that can see a draft, and the
 * predicate that reads one as locked.
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

  it('asks for the raw perspective, the only one that can see a draft', () => {
    expect(LOCK_FETCH_OPTIONS.perspective).toBe('raw')
  })

  it('projects the lock flag the same way whether it asks by id or by type', () => {
    expect(LOCKED_BY_ID).toBe('*[_id in $ids]{_id, "locked": migration.locked}')
    expect(LOCKED_BY_TYPE).toBe('*[_type in $types]{_id, "locked": migration.locked}')
  })
})

/**
 * Routes resolve a document with `…[0]`, so two documents claiming one slug
 * make the served page a coin flip — which is how a leftover `page-home`
 * shadowed the homepage seed and served two sections instead of eight. `load`
 * reports collisions after it commits and `verify` checks for them; these pin
 * the one answer both get.
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

  it('leaves one slug claimed once alone, under any number of types', () => {
    expect(
      slugCollisions([
        { _id: 'page-seed-about', _type: 'page', slug: 'about' },
        { _id: 'insight-wp-1', _type: 'insight', slug: 'about' },
      ]),
    ).toEqual([])
  })

  it('reads the collision out the same way for both entry points', () => {
    expect(
      describeSlugCollision({ key: 'page:index', ids: ['page-home', 'page-seed-index'] }),
    ).toBe('page:index → page-home, page-seed-index')
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

  it('asks the dataset for published routable slugs only', () => {
    expect(ROUTABLE_SLUGS).toBe(
      '*[_type in $types && defined(slug.current) && !(_id in path("drafts.**"))]{_id, _type, "slug": slug.current}',
    )
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
