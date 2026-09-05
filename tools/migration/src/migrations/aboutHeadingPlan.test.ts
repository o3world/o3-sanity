import { describe, expect, it } from 'vitest'
import { planAboutHeading, type AboutHeadingRow } from './aboutHeadingPlan'

const about = (overrides: Partial<AboutHeadingRow> = {}): AboutHeadingRow => ({
  _id: 'page-seed-about',
  _rev: 'revision',
  _type: 'page',
  slug: { current: 'about' },
  sections: [{ _key: 'why', _type: 'layoutSection' }],
  ...overrides,
})

describe('About heading migration', () => {
  it('plans only the targeted field with its observed revision', () => {
    expect(planAboutHeading(about())).toEqual({
      id: 'page-seed-about',
      revision: 'revision',
      set: { 'sections[_key=="why"].headingLevel': 'xl' },
    })
  })
  it('is a no-op after the correction', () => {
    expect(
      planAboutHeading(
        about({ sections: [{ _key: 'why', _type: 'layoutSection', headingLevel: 'xl' }] }),
      ),
    ).toBeNull()
  })
  it('refuses locked content, another page, ambiguous sections and explicit editorial choices', () => {
    expect(() => planAboutHeading(about({ migration: { locked: true } }))).toThrow('locked')
    expect(() => planAboutHeading(about({ _id: 'another-page' }))).toThrow('published About')
    expect(() => planAboutHeading(about({ sections: [] }))).toThrow('exactly one')
    expect(() =>
      planAboutHeading(
        about({ sections: [{ _key: 'why', _type: 'layoutSection', headingLevel: 'lg' }] }),
      ),
    ).toThrow('authored')
  })
})
