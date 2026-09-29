import { describe, expect, it } from 'vitest'
import { ABOUT_PORTRAITS, planAboutPortrait, type PortraitRow } from './aboutPortraitsPlan'

const target = ABOUT_PORTRAITS[0]!
const row = (changes: Partial<PortraitRow> = {}): PortraitRow => ({
  _id: target.id,
  _rev: 'before',
  _type: 'person',
  name: target.name,
  headshot: structuredClone(target.expectedHeadshot),
  ...changes,
})

describe('About portrait migration', () => {
  it('changes only the reviewed headshot asset and is idempotent', () => {
    for (const target of ABOUT_PORTRAITS) {
      const person = row({ _id: target.id, name: target.name, headshot: target.expectedHeadshot })
      const before = structuredClone(person)
      const plan = planAboutPortrait(person)!
      expect(plan).toEqual({
        id: target.id,
        revision: 'before',
        set: {
          'headshot.asset': { _type: 'reference', _ref: target.asset },
        },
      })
      expect(person).toEqual(before)
      expect(
        planAboutPortrait({
          ...person,
          headshot: {
            ...target.expectedHeadshot,
            asset: plan.set['headshot.asset'],
          },
        }),
      ).toBeNull()
    }
  })

  it('leaves selected existing draft portraits and their authored image fields untouched', () => {
    for (const target of ABOUT_PORTRAITS.filter((person) => person.sourceDraft)) {
      const draft = row({
        _id: target.sourceDraft!,
        name: target.name,
        migration: { locked: true },
        headshot: {
          ...target.expectedHeadshot,
          asset: { _type: 'reference', _ref: target.asset },
          crop: { left: 0.1, top: 0, right: 0, bottom: 0 },
          hotspot: { x: 0.5, y: 0.4, width: 1, height: 0.7 },
          alt: 'Editor description',
        },
      })
      const before = structuredClone(draft)
      expect(planAboutPortrait(draft)).toBeNull()
      expect(draft).toEqual(before)
    }
  })

  it('plans a draft independently without publishing it', () => {
    expect(planAboutPortrait(row({ _id: `drafts.${target.id}` }))?.id).toBe(`drafts.${target.id}`)
  })

  it('refuses locks, edited headshots and authored crop/hotspot', () => {
    expect(() => planAboutPortrait(row({ migration: { locked: true } }))).toThrow(
      'Migration-locked',
    )
    for (const change of [
      { asset: { _type: 'reference', _ref: 'image-editor-choice' } },
      { crop: { left: 0.1, right: 0, top: 0, bottom: 0 } },
      { hotspot: { x: 0.5, y: 0.4, width: 1, height: 0.7 } },
      { alt: 'Editor description' },
    ])
      expect(() =>
        planAboutPortrait(
          row({
            headshot: {
              ...target.expectedHeadshot,
              ...change,
            },
          }),
        ),
      ).toThrow('Headshot changed since review')
  })

  it('refuses an unexpected identity, type, name or missing revision', () => {
    for (const change of [
      { _id: 'person-other' },
      { _type: 'page' },
      { name: 'Other' },
      { _rev: '' },
    ])
      expect(() => planAboutPortrait(row(change))).toThrow('Unexpected portrait document')
  })
})
