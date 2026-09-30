import { describe, expect, it } from 'vitest'
import { planAboutCharcoal, type AboutSurfaceRow } from './aboutCharcoalPlan'

const about: AboutSurfaceRow = {
  _id: 'page-seed-about',
  _rev: 'snapshot',
  _type: 'page',
  sections: [{ _key: 'beyond', _type: 'layoutSection', surface: 'ink' }],
}

describe('About Neutral-900 migration', () => {
  it.each(['page-seed-about', 'drafts.page-seed-about'])(
    'patches only the approved surface in %s',
    (_id) => {
      expect(planAboutCharcoal({ ...about, _id })).toEqual({
        id: _id,
        revision: 'snapshot',
        set: { 'sections[_key=="beyond"].surface': 'charcoal' },
      })
    },
  )
  it('reruns as a no-op and refuses unrelated, locked or changed content', () => {
    expect(
      planAboutCharcoal({ ...about, sections: [{ ...about.sections![0]!, surface: 'charcoal' }] }),
    ).toBeNull()
    expect(() => planAboutCharcoal({ ...about, _id: 'page-seed-index' })).toThrow('Unexpected')
    expect(() => planAboutCharcoal({ ...about, migration: { locked: true } })).toThrow(
      'migration-locked',
    )
    expect(() => planAboutCharcoal({ ...about, sections: [] })).toThrow('Expected')
    expect(() =>
      planAboutCharcoal({ ...about, sections: [{ ...about.sections![0]!, surface: 'white' }] }),
    ).toThrow('Surface changed')
  })
})
