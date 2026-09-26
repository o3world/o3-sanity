import { expect, it } from 'vitest'
import {
  planSolutionsEngagementAlignment,
  type SolutionsEngagementRow,
} from './solutionsEngagementAlignmentPlan'

const row: SolutionsEngagementRow = {
  _id: 'page-seed-solutions',
  _rev: 'rev',
  _type: 'page',
  slug: { current: 'solutions' },
  sections: [{ _key: 'engagements', _type: 'railPanelsSection', layout: 'track' }],
}
it('changes only the engagement layout with a revision guard and reruns as a no-op', () => {
  expect(planSolutionsEngagementAlignment(row)).toEqual({
    id: row._id,
    revision: row._rev,
    set: { 'sections[_key=="engagements"].layout': 'cards' },
  })
  expect(
    planSolutionsEngagementAlignment({
      ...row,
      sections: [{ ...row.sections![0]!, layout: 'cards' }],
    }),
  ).toBeNull()
})
it('refuses unexpected identities, layouts, duplicate sections and locked content', () => {
  expect(() => planSolutionsEngagementAlignment({ ...row, _id: 'other' })).toThrow()
  expect(() =>
    planSolutionsEngagementAlignment({
      ...row,
      sections: [{ ...row.sections![0]!, layout: 'rail' }],
    }),
  ).toThrow()
  expect(() =>
    planSolutionsEngagementAlignment({ ...row, sections: [...row.sections!, ...row.sections!] }),
  ).toThrow()
  expect(() => planSolutionsEngagementAlignment({ ...row, migration: { locked: true } })).toThrow()
})
