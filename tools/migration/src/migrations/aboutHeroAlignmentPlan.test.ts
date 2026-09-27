import { expect, it } from 'vitest'
import { planAboutHeroAlignment, type AboutHeroRow } from './aboutHeroAlignmentPlan'

it('targets only alignment, is idempotent, and refuses locked or ambiguous content', () => {
  const row: AboutHeroRow = {
    _id: 'page-seed-about',
    _rev: 'revision',
    _type: 'page',
    slug: { current: 'about' },
    sections: [{ _key: 'hero', _type: 'heroSection', variant: 'band' }],
  }
  expect(planAboutHeroAlignment(row)).toEqual({
    id: row._id,
    revision: row._rev,
    set: { 'sections[_key=="hero"].alignment': 'center' },
  })
  expect(
    planAboutHeroAlignment({ ...row, sections: [{ ...row.sections![0]!, alignment: 'center' }] }),
  ).toBeNull()
  expect(() => planAboutHeroAlignment({ ...row, migration: { locked: true } })).toThrow('locked')
  expect(() => planAboutHeroAlignment({ ...row, _id: 'another-page' })).toThrow('published About')
  expect(() => planAboutHeroAlignment({ ...row, sections: [] })).toThrow('exactly one')
  expect(() =>
    planAboutHeroAlignment({ ...row, sections: [...row.sections!, ...row.sections!] }),
  ).toThrow('exactly one')
})

it('plans the same single-field correction for the draft without changing its identity', () => {
  const draft: AboutHeroRow = {
    _id: 'drafts.page-seed-about',
    _rev: 'draft-revision',
    _type: 'page',
    slug: { current: 'about' },
    sections: [{ _key: 'hero', _type: 'heroSection', variant: 'band' }],
  }
  expect(planAboutHeroAlignment(draft)).toEqual({
    id: draft._id,
    revision: draft._rev,
    set: { 'sections[_key=="hero"].alignment': 'center' },
  })
  expect(() => planAboutHeroAlignment({ ...draft, migration: { locked: true } })).toThrow('locked')
  expect(
    planAboutHeroAlignment({
      ...draft,
      sections: [{ ...draft.sections![0]!, alignment: 'center' }],
    }),
  ).toBeNull()
})
