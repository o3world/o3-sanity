import { describe, expect, it } from 'vitest'
import { planContactComposition, type ContactCompositionRow } from './contactCompositionPlan'

const page = (id = 'page-seed-contact'): ContactCompositionRow => ({
  _id: id,
  _rev: 'editor-revision',
  _type: 'page',
  slug: { current: 'contact' },
  sections: [
    {
      _type: 'heroSection',
      _key: 'hero',
      variant: 'band',
      headlineLines: ['Original line', 'Another line'],
      eyebrow: 'Original eyebrow',
      subheading: 'Original copy',
      decoration: 'orbs',
    },
    {
      _type: 'formSection',
      _key: 'inquiry',
      reasons: ['Authored reason'],
      quote: 'Authored quote',
      details: [{ _key: 'address', items: ['Authored address'] }],
      button: { label: 'Original submit' },
    },
    { _type: 'layoutSection', _key: 'other', heading: 'Keep me' },
  ],
})

describe('Contact composition migration', () => {
  it('moves each version’s own intro, keeps all form and unrelated content, and reruns as a no-op', () => {
    for (const id of ['page-seed-contact', 'drafts.page-seed-contact']) {
      const row = page(id)
      const plan = planContactComposition(row)!
      expect(plan.id).toBe(id)
      expect(plan.revision).toBe(row._rev)
      expect(plan.set.sections).toEqual([
        {
          ...row.sections![1],
          variant: 'hero',
          surface: 'paper',
          heading: 'Original line\nAnother line',
          eyebrow: 'Original eyebrow',
          note: 'Original copy',
          decoration: 'orbs',
          button: { label: 'Original submit', contrast: 'brand' },
        },
        row.sections![2],
      ])
      expect(row.sections).toHaveLength(3)
      expect(planContactComposition({ ...row, ...plan.set })).toBeNull()
    }
  })
  it('refuses conflicting copy, unsupported hero content, locks, and unrelated documents', () => {
    const conflicting = page()
    conflicting.sections![1]!.heading = 'Editor changed this'
    expect(() => planContactComposition(conflicting)).toThrow('Existing form heading')
    const withButton = page()
    withButton.sections![0]!.button = { label: 'Keep this too' }
    expect(() => planContactComposition(withButton)).toThrow('Hero field button')
    expect(() => planContactComposition({ ...page(), migration: { locked: true } })).toThrow(
      'migration-locked',
    )
    expect(() => planContactComposition(page('another-page'))).toThrow('Expected the Contact')
    const changedOrder = page()
    changedOrder.sections!.reverse()
    expect(() => planContactComposition(changedOrder)).toThrow('adjacent')
  })
})
