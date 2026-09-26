import { describe, expect, it } from 'vitest'
import { planHomeQuoteSize, type HomeQuoteRow } from './homeQuoteSizePlan'

const row: HomeQuoteRow = {
  _id: 'page-seed-index',
  _rev: 'revision',
  _type: 'page',
  slug: { current: 'index' },
  sections: [{ _key: 'quote', _type: 'quoteSection', size: 'small' }],
}

describe('Home quote size migration', () => {
  it('patches only size with a revision guard for published and draft records, then becomes a no-op', () => {
    for (const id of ['page-seed-index', 'drafts.page-seed-index']) {
      expect(planHomeQuoteSize({ ...row, _id: id })).toEqual({
        id,
        revision: 'revision',
        set: { 'sections[_key=="quote"].size': 'medium' },
      })
      expect(
        planHomeQuoteSize({
          ...row,
          _id: id,
          sections: [{ _key: 'quote', _type: 'quoteSection', size: 'medium' }],
        }),
      ).toBeNull()
    }
  })
  it('refuses locks, unexpected identities, ambiguous quotes and unknown sizes', () => {
    for (const invalid of [
      { ...row, migration: { locked: true } },
      { ...row, _id: 'page-seed-about' },
      { ...row, sections: [...row.sections!, ...row.sections!] },
      { ...row, sections: [{ _key: 'other', _type: 'quoteSection' }] },
      { ...row, sections: [{ _key: 'quote', _type: 'quoteSection', size: 'unexpected' }] },
    ])
      expect(() => planHomeQuoteSize(invalid)).toThrow()
  })
})
