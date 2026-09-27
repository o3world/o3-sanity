import { describe, expect, it } from 'vitest'
import { planHomeShowcaseButton, type HomeShowcaseRow } from './homeShowcaseButtonPlan'
const row: HomeShowcaseRow = {
  _id: 'page-seed-index',
  _rev: 'revision',
  _type: 'page',
  slug: { current: 'index' },
  sections: [{ _key: 'work', _type: 'caseShowcaseSection', button: { contrast: 'light' } }],
}
describe('Home showcase button migration', () => {
  it('changes only contrast on both document versions and reruns without a write', () => {
    for (const id of ['page-seed-index', 'drafts.page-seed-index']) {
      expect(planHomeShowcaseButton({ ...row, _id: id })).toEqual({
        id,
        revision: 'revision',
        set: { 'sections[_key=="work"].button.contrast': 'brand' },
      })
      expect(
        planHomeShowcaseButton({
          ...row,
          _id: id,
          sections: [{ _key: 'work', _type: 'caseShowcaseSection', button: { contrast: 'brand' } }],
        }),
      ).toBeNull()
    }
    expect(planHomeShowcaseButton({ ...row, sections: [] })).toBeNull()
    expect(
      planHomeShowcaseButton({
        ...row,
        sections: [{ _key: 'work', _type: 'caseShowcaseSection' }],
      }),
    ).toBeNull()
  })
  it('refuses locks, unrelated documents, duplicate sections and unexpected contrast', () => {
    for (const invalid of [
      { ...row, migration: { locked: true } },
      { ...row, _id: 'page-seed-about' },
      { ...row, sections: [...row.sections!, ...row.sections!] },
      {
        ...row,
        sections: [{ _key: 'work', _type: 'caseShowcaseSection', button: { contrast: 'ghost' } }],
      },
    ])
      expect(() => planHomeShowcaseButton(invalid)).toThrow()
  })
})
