import { expect, it } from 'vitest'

import { planRetireUnrenderedFields, type RetireRow } from './retireUnrenderedFieldsPlan'

const page: RetireRow = {
  _id: 'page-seed-home',
  _rev: 'revision',
  _type: 'page',
  sections: [
    {
      _key: 'hero',
      _type: 'heroSection',
      eyebrow: 'WORK',
      button: { _type: 'button', icon: 'arrow' },
    },
    { _key: 'quote', _type: 'quoteSection', eyebrow: 'Trusted by', quote: 'Words.' },
    {
      _key: 'grid',
      _type: 'featureGridSection',
      features: [
        { _key: 'one', _type: 'feature', heading: 'One', icon: 'gear' },
        { _key: 'two', _type: 'feature', heading: 'Two' },
        { _key: 'three', _type: 'feature', heading: 'Three', icon: 'none' },
      ],
    },
  ],
}

it('unsets the quote eyebrow and each feature icon, and nothing else', () => {
  const before = structuredClone(page)
  expect(planRetireUnrenderedFields(page)).toEqual({
    id: 'page-seed-home',
    revision: 'revision',
    unset: [
      'sections[_key=="quote"].eyebrow',
      'sections[_key=="grid"].features[_key=="one"].icon',
      'sections[_key=="grid"].features[_key=="three"].icon',
    ],
    removed: {
      'sections[_key=="quote"].eyebrow': 'Trusted by',
      'sections[_key=="grid"].features[_key=="one"].icon': 'gear',
      'sections[_key=="grid"].features[_key=="three"].icon': 'none',
    },
  })
  expect(page).toEqual(before)
})

it('finds the blocks in any array, and keeps a draft a draft', () => {
  const plan = planRetireUnrenderedFields({
    _id: 'drafts.caseStudy-wp-1',
    _rev: 'draft-revision',
    _type: 'caseStudy',
    story: [{ _type: 'quoteSection', eyebrow: 'No key', quote: 'Words.' }],
  })
  expect(plan?.id).toBe('drafts.caseStudy-wp-1')
  expect(plan?.revision).toBe('draft-revision')
  // A member with no `_key` is addressed by index; the revision guard holds the order.
  expect(plan?.unset).toEqual(['story[0].eyebrow'])
})

it('plans a locked document like any other', () => {
  expect(planRetireUnrenderedFields({ ...page, migration: { locked: true } })?.unset).toHaveLength(
    3,
  )
})

it('has nothing to do for a document that holds neither field', () => {
  expect(
    planRetireUnrenderedFields({
      _id: 'collectionIndex-insights',
      _rev: 'revision',
      _type: 'collectionIndex',
      sectionsAbove: [
        { _key: 'hero', _type: 'heroSection', eyebrow: 'INSIGHTS' },
        { _key: 'quote', _type: 'quoteSection', quote: 'Words.' },
        { _key: 'grid', _type: 'featureGridSection', features: [{ _key: 'a', heading: 'A' }] },
      ],
    }),
  ).toBeNull()
})

it('refuses a document it cannot guard with a revision', () => {
  expect(() => planRetireUnrenderedFields({ ...page, _rev: '' })).toThrow(/revision/)
})
