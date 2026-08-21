import { describe, expect, it } from 'vitest'

import { LOCKED_BY_ID, LOCKED_BY_TYPE, LOCK_FETCH_OPTIONS, isLocked, lockedIds } from './state'

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
