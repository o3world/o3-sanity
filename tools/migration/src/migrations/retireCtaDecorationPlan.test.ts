import { expect, it } from 'vitest'
import { planCtaDecorationRetirement } from './retireCtaDecorationPlan'

it('removes only retired CTA settings and reruns as a no-op without altering hero, copy, or locks', () => {
  for (const [type, field] of [
    ['page', 'sections'],
    ['collectionIndex', 'sectionsBelow'],
    ['caseStudy', 'story'],
  ]) {
    const sections = [
      { _key: 'hero', _type: 'heroSection', decoration: 'orbs' },
      { _key: 'cta', _type: 'ctaSection', decoration: 'orbs', heading: 'Authored words' },
    ]
    const row = {
      _id: 'drafts.doc',
      _rev: 'revision',
      _type: type!,
      migration: { locked: true },
      [field!]: sections,
    }
    const plan = planCtaDecorationRetirement(row)!
    expect(plan.unset).toEqual([`${field}[_key=="cta"].decoration`])
    expect(row[field!]).toEqual(sections)
    const after = structuredClone(row)
    delete (after[field!] as { decoration?: string }[])[1]!.decoration
    expect(planCtaDecorationRetirement(after)).toBeNull()
    expect((after[field!] as typeof sections)[0]!.decoration).toBe('orbs')
    expect(after.migration).toEqual({ locked: true })
  }
})
it('refuses unfamiliar values, duplicate keys, wrong types and missing revisions', () => {
  const row = {
    _id: 'doc',
    _rev: 'revision',
    _type: 'page',
    sections: [{ _key: 'cta', _type: 'ctaSection', decoration: 'orbs' }],
  }
  for (const invalid of [
    { ...row, _rev: '' },
    { ...row, _type: 'client' },
    { ...row, sections: [{ ...row.sections[0], decoration: 'custom' }] },
    { ...row, sections: [...row.sections, ...row.sections] },
  ])
    expect(() => planCtaDecorationRetirement(invalid)).toThrow()
})
