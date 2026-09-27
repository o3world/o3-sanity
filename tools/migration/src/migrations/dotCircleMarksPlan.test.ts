import { expect, it } from 'vitest'
import { planDotCircleMarks } from './dotCircleMarksPlan'

const ARROW = 'image-030f9cd68e0fb696fef977516f426cf39ba81cf4-66x66-svg'
const KEY = 'image-06209950ecc2975e61ed4d6d0868779ee4cb2e6d-66x66-svg'
const ICONS = { [ARROW]: 'arrow', [KEY]: 'key' } as const

const artwork = (ref: string) => ({
  _type: 'mark',
  kind: 'image',
  media: { _type: 'figure', image: { _type: 'image', asset: { _type: 'reference', _ref: ref } } },
})

const solutions = () => ({
  _id: 'drafts.page-seed-solutions',
  _rev: 'revision',
  _type: 'page',
  migration: { locked: true },
  sections: [
    {
      _key: 'engagements',
      _type: 'railPanelsSection',
      panels: [
        { _key: 'eng-full', _type: 'panel', mark: artwork(KEY) },
        { _key: 'eng-photo', _type: 'panel', mark: artwork('image-ffff-400x400-png') },
        { _key: 'eng-orb', _type: 'panel', mark: { _type: 'mark', kind: 'orb' } },
      ],
    },
  ],
})

it('turns only the Dot Circle artwork marks into Dot Circles, keeps their media, and reruns as a no-op', () => {
  const row = solutions()
  const plan = planDotCircleMarks(row, ICONS)!
  const path = 'sections[_key=="engagements"].panels[_key=="eng-full"].mark'
  expect(plan).toEqual({
    id: 'drafts.page-seed-solutions',
    revision: 'revision',
    before: { [`${path}.kind`]: 'image', [`${path}.icon`]: null },
    set: { [`${path}.kind`]: 'dotCircle', [`${path}.icon`]: 'key' },
  })
  expect(row).toEqual(solutions())

  const after = structuredClone(row)
  const mark = after.sections[0]!.panels[0]!.mark as Record<string, unknown>
  Object.assign(mark, { kind: 'dotCircle', icon: 'key' })
  expect(planDotCircleMarks(after, ICONS)).toBeNull()
  expect(mark.media).toEqual(artwork(KEY).media)
})

it('finds a Dot Circle on the Sanity partner page too, including one nested in a layout column', () => {
  const plan = planDotCircleMarks(
    {
      _id: 'page-seed-partners-sanity',
      _rev: 'revision',
      _type: 'page',
      sections: [
        {
          _key: 'why',
          _type: 'featureGridSection',
          features: [{ _key: 'why-both', _type: 'feature', mark: artwork(ARROW) }],
        },
        { _key: 'column', _type: 'layoutSection', items: [{ _key: 'm', ...artwork(ARROW) }] },
      ],
    },
    ICONS,
  )!
  expect(plan.set).toEqual({
    'sections[_key=="why"].features[_key=="why-both"].mark.kind': 'dotCircle',
    'sections[_key=="why"].features[_key=="why-both"].mark.icon': 'arrow',
    'sections[_key=="column"].items[_key=="m"].kind': 'dotCircle',
    'sections[_key=="column"].items[_key=="m"].icon': 'arrow',
  })
})

it('refuses other documents, missing revisions, unkeyed arrays and a Dot Circle holding another icon', () => {
  const row = solutions()
  const conflicting = solutions()
  Object.assign(conflicting.sections[0]!.panels[0]!.mark, { kind: 'dotCircle', icon: 'heart' })
  const unkeyed = solutions()
  delete (unkeyed.sections[0]!.panels[0] as { _key?: string })._key
  for (const invalid of [
    { ...row, _id: 'page-seed-about' },
    { ...row, _rev: '' },
    unkeyed,
    conflicting,
  ])
    expect(() => planDotCircleMarks(invalid, ICONS)).toThrow()
})
