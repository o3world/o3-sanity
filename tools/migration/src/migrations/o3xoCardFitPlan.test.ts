import { describe, expect, it } from 'vitest'
import { planO3xoCardFit, type CardFitRow } from './o3xoCardFitPlan'

function page(draft = false): CardFitRow {
  return {
    _id: `${draft ? 'drafts.' : ''}page-seed-about`,
    _rev: 'snapshot',
    _type: 'page',
    sections: [
      {
        _key: 'beyond',
        _type: 'layoutSection',
        items: [{ _key: 'b-ventures', _type: 'mediaCard', heading: 'O3XO' }],
      },
    ],
  }
}

describe('approved O3XO card framing', () => {
  it.each([false, true])(
    'patches only fit and retains the version and revision (draft: %s)',
    (draft) => {
      const row = page(draft)
      expect(planO3xoCardFit(row)).toEqual({
        id: row._id,
        revision: 'snapshot',
        set: { 'sections[_key=="beyond"].items[_key=="b-ventures"].fit': 'contain' },
      })
    },
  )

  it('is a no-op when already applied and refuses locked or authored changes', () => {
    const row = page()
    row.migration = { locked: true }
    expect(() => planO3xoCardFit(row)).toThrow('migration-locked')
    row.migration.locked = false
    row.sections![0]!.items![0]!.fit = 'crop'
    expect(() => planO3xoCardFit(row)).toThrow('authored fit')
    row.sections![0]!.items![0]!.fit = 'contain'
    expect(planO3xoCardFit(row)).toBeNull()
  })

  it('refuses unrelated documents or a replaced card', () => {
    expect(() => planO3xoCardFit({ ...page(), _id: 'page-seed-solutions' })).toThrow('Unexpected')
    const row = page()
    row.sections![0]!.items![0]!.heading = 'Other artwork'
    expect(() => planO3xoCardFit(row)).toThrow('approved O3XO card')
  })
})
