import { expect, it } from 'vitest'

import { planPlatformAnchors, type AnchorRow } from './platformAnchorsPlan'

const BAND = 'sections[_key=="platforms"]'

const home = (): AnchorRow => ({
  _id: 'page-seed-index',
  _rev: 'revision',
  migration: { locked: false },
  sections: [
    { _key: 'hero', _type: 'heroSection' },
    {
      _key: 'platforms',
      _type: 'railPanelsSection',
      panels: [
        { _key: 'plat-sanity', _type: 'panel', railLabel: 'Sanity' },
        { _key: '7721a22e1c0a', _type: 'panel', railLabel: 'Vercel' },
        { _key: 'plat-lovable', _type: 'panel', railLabel: 'Lovable' },
      ],
    },
    {
      _key: 'ventures',
      _type: 'railPanelsSection',
      panels: [{ _key: 'v1', _type: 'panel', railLabel: 'Sanity' }],
    },
  ],
})

it('anchors the platforms band and its three panels, finding Vercel by its label', () => {
  const row = home()
  const before = structuredClone(row)
  expect(planPlatformAnchors(row)).toEqual({
    id: 'page-seed-index',
    revision: 'revision',
    set: {
      [`${BAND}.anchor`]: 'tech-platforms',
      [`${BAND}.panels[_key=="plat-sanity"].anchor`]: 'sanity',
      [`${BAND}.panels[_key=="7721a22e1c0a"].anchor`]: 'vercel',
      [`${BAND}.panels[_key=="plat-lovable"].anchor`]: 'lovable',
    },
    kept: [],
  })
  expect(row).toEqual(before)
})

it('is a no-op on a page that already carries the anchors', () => {
  const row = home()
  const band = row.sections![1]!
  band.anchor = 'tech-platforms'
  for (const panel of band.panels!) panel.anchor = panel.railLabel!.toLowerCase()
  expect(planPlatformAnchors(row)).toBeNull()
})

it('keeps an anchor an editor already wrote and says so', () => {
  const row = home()
  row.sections![1]!.panels![1]!.anchor = 'nextjs'
  const plan = planPlatformAnchors(row)!
  expect(plan.set).not.toHaveProperty(`${BAND}.panels[_key=="7721a22e1c0a"].anchor`)
  expect(plan.set).toHaveProperty(`${BAND}.anchor`, 'tech-platforms')
  expect(plan.kept).toEqual([
    `${BAND}.panels[_key=="7721a22e1c0a"].anchor is "nextjs", not "vercel"`,
  ])
})

it('says which tab it could not find rather than guessing', () => {
  const row = home()
  row.sections![1]!.panels!.splice(2, 1)
  expect(planPlatformAnchors(row)!.kept).toEqual([
    'no panel labelled "Lovable" in the platforms band',
  ])
})

it('changes nothing on a page without the platforms band', () => {
  const row = home()
  row.sections!.splice(1, 1)
  expect(planPlatformAnchors(row)).toEqual({
    id: 'page-seed-index',
    revision: 'revision',
    set: {},
    kept: ['no railPanelsSection keyed "platforms"'],
  })
})

it('stops at a locked document, since the names come from outside it', () => {
  const row = home()
  row.migration = { locked: true }
  expect(() => planPlatformAnchors(row)).toThrow(/locked/)
})
