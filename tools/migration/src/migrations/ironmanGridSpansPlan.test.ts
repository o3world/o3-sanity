import { expect, it } from 'vitest'
import { planIronmanGridSpans, type IronmanGridRow } from './ironmanGridSpansPlan'

const fixture: IronmanGridRow = {
  _id: 'caseStudy-wp-10028',
  _rev: 'revision',
  _type: 'caseStudy',
  slug: { current: 'case-studies-ironman-digital-experience-drupal-acquia' },
  migration: { locked: true },
  story: [
    {
      _key: 'screens-0',
      _type: 'screenGridSection',
      screens: [
        ['media-2', 'b350d0f1e1c5610cf332d40060c2defab636d639-1776x810', 'standard'],
        ['media-3', '11e5532f1370548a6466623cae017b93c5bd7017-1216x684', 'standard'],
        ['figma-lionel-banner', '9d7054de0622fc46f30978169a926c014e8d4e8f-2496x668', 'wide'],
        ['media-4', '4aaf2ec6621051e440c92eacaf24509445244125-1216x684', 'standard'],
        ['media-5', '8bb1fae8fdd6a6f0431ad82d825b12d848492762-1216x684', 'standard'],
      ].map(([key, asset, span]) => ({
        _key: key,
        span,
        media: { image: { asset: { _ref: `image-${asset}-png` } } },
      })),
    },
  ],
}

it('proposes only the two row spans and reports the lock and outstanding asset work', () => {
  const before = structuredClone(fixture)
  const plan = planIronmanGridSpans(fixture)!
  expect(plan.id).toBe(fixture._id)
  expect(plan.revision).toBe('revision')
  expect(plan.set).toEqual({
    'story[_key=="screens-0"].screens[_key=="media-4"].span': 'twoThirds',
    'story[_key=="screens-0"].screens[_key=="media-5"].span': 'third',
  })
  expect(plan.blocked).toHaveLength(2)
  expect(plan.blocked[0]).toContain('locked')
  expect(fixture).toEqual(before)
  const applied = structuredClone(fixture)
  applied.story![0]!.screens![3]!.span = 'twoThirds'
  applied.story![0]!.screens![4]!.span = 'third'
  expect(planIronmanGridSpans(applied)).toBeNull()
})

it('preserves draft identity and refuses changed documents or screen composition', () => {
  expect(planIronmanGridSpans({ ...fixture, _id: `drafts.${fixture._id}` })?.id).toBe(
    `drafts.${fixture._id}`,
  )
  for (const patch of [
    { _id: 'other' },
    { _rev: '' },
    { story: [] },
    { story: [...fixture.story!, ...fixture.story!] },
  ])
    expect(() => planIronmanGridSpans({ ...fixture, ...patch })).toThrow()
  for (const change of ['asset', 'span', 'order', 'layout']) {
    const row = structuredClone(fixture)
    const grid = row.story![0]!
    if (change === 'asset') grid.screens![3]!.media!.image!.asset!._ref = 'different'
    if (change === 'span') grid.screens![3]!.span = 'wide'
    if (change === 'order') grid.screens!.reverse()
    if (change === 'layout') grid.layout = 'feature'
    expect(() => planIronmanGridSpans(row), change).toThrow()
  }
})
