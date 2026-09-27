import { describe, expect, it } from 'vitest'
import {
  planAboutComposition,
  readAboutCompositionAssets,
  type AboutCompositionRow,
} from './aboutCompositionPlan'

const assets = {
  background: `image-${'1'.repeat(40)}-1248x550-png`,
  logo: `image-${'2'.repeat(40)}-873x181-svg`,
  badge: `image-${'3'.repeat(40)}-314x36-svg`,
}
const figure = {
  _key: '6623bfef31c8',
  _type: 'figure',
  alt: 'Authored alternative',
  caption: 'Authored caption',
  image: {
    asset: { _ref: 'image-e841d5ab8f0617e66cba08e02dcce69b3ae03dab-2000x1333-jpg' },
    crop: { top: 0.1 },
    hotspot: { x: 0.4 },
  },
}
const page = (id = 'page-seed-about'): AboutCompositionRow => ({
  _id: id,
  _rev: 'editor-revision',
  _type: 'page',
  slug: { current: 'about' },
  sections: [
    { _key: 'hero', _type: 'heroSection', surface: id.startsWith('drafts.') ? 'ink' : 'paper' },
    {
      _key: 'why',
      _type: 'layoutSection',
      columns: 1,
      width: 'article',
      items: [{ _key: 'why-body', _type: 'richText', body: [{ text: 'Authored copy' }] }, figure],
    },
    { _key: 'extra', _type: 'railPanelsSection', panels: ['Keep all authored extras'] },
    { _key: 'optimize', _type: 'railPanelsSection', layout: 'track' },
    { _key: 'team', _type: 'personGridSection', people: ['Authored person'] },
    { _key: 'beyond', _type: 'layoutSection', items: ['Authored card'] },
    { _key: 'cta', _type: 'ctaSection', heading: 'Authored CTA' },
  ],
})

describe('About composition migration', () => {
  it.each(['page-seed-about', 'drafts.page-seed-about'])(
    'preserves %s content and figure, reorders sections, and reruns without overwriting',
    (id) => {
      const row = page(id)
      const original = structuredClone(row)
      const plan = planAboutComposition(row, assets)!
      expect(plan.id).toBe(id)
      expect(plan.revision).toBe('editor-revision')
      const sections = plan.set.sections
      expect(sections.map((section) => section._key)).toEqual([
        'hero',
        'team-photo',
        'why',
        'philly-made',
        'optimize',
        'extra',
        'beyond',
        'team',
        'cta',
      ])
      expect(sections[1]).toEqual({
        _key: 'team-photo',
        _type: 'mediaSection',
        variant: 'overlap',
        width: 'section',
        surface: 'white',
        media: figure,
      })
      expect(sections[2]).toEqual({
        ...row.sections![1],
        items: [{ _key: 'why-body', _type: 'richText', body: [{ text: 'Authored copy' }] }],
      })
      for (const section of row.sections!.filter((section) => section._key !== 'why'))
        expect(sections).toContainEqual(section)
      expect(sections[3]).toMatchObject({
        variant: 'feature',
        heading: 'Philly made.',
        logo: { asset: { _ref: assets.logo } },
        badge: { asset: { _ref: assets.badge } },
        media: { image: { asset: { _ref: assets.background } } },
      })
      expect(row).toEqual(original)
      expect(planAboutComposition({ ...row, ...plan.set }, assets)).toBeNull()
      const edited = structuredClone(plan.set.sections)
      edited[3]!.heading = 'A later authored headline'
      expect(planAboutComposition({ ...row, sections: edited }, assets)).toBeNull()
    },
  )

  it('refuses locks, unrelated documents and duplicate or missing keys', () => {
    expect(() => planAboutComposition({ ...page(), migration: { locked: true } }, assets)).toThrow(
      'migration-locked',
    )
    expect(() => planAboutComposition(page('another-page'), assets)).toThrow('Expected the About')
    expect(() => planAboutComposition({ ...page(), _type: 'caseStudy' }, assets)).toThrow(
      'Expected the About',
    )
    expect(() => planAboutComposition({ ...page(), slug: { current: 'work' } }, assets)).toThrow(
      'Expected the About',
    )
    expect(() => planAboutComposition({ ...page(), _rev: '' }, assets)).toThrow('revision')
    const duplicate = page()
    duplicate.sections!.push(duplicate.sections![0]!)
    expect(() => planAboutComposition(duplicate, assets)).toThrow('unique keyed')
    const missing = page()
    missing.sections = missing.sections!.filter((section) => section._key !== 'beyond')
    expect(() => planAboutComposition(missing, assets)).toThrow('Expected beyond')
  })

  it('refuses changed source figures and partial migrations', () => {
    const row = page()
    row.sections![1]!.items = [
      { _key: 'why-body', _type: 'richText' },
      { ...figure, _key: 'different' },
    ]
    expect(() => planAboutComposition(row, assets)).toThrow('existing keyed O3 team figure')
    const changed = page()
    changed.sections![1]!.items = [
      { _key: 'why-body', _type: 'richText' },
      { ...figure, image: { asset: { _ref: assets.background } } },
    ]
    expect(() => planAboutComposition(changed, assets)).toThrow('existing keyed O3 team figure')
    const partial = page()
    partial.sections!.splice(1, 0, {
      _key: 'team-photo',
      _type: 'mediaSection',
      variant: 'overlap',
      media: figure,
    })
    expect(() => planAboutComposition(partial, assets)).toThrow('Partial or conflicting')
  })

  it('validates supplied asset references before planning', () => {
    expect(readAboutCompositionAssets(assets)).toEqual(assets)
    for (const input of [
      null,
      {},
      { ...assets, logo: 'https://example.com/logo.svg' },
      { ...assets, badge: 'file-123-svg' },
    ])
      expect(() => readAboutCompositionAssets(input)).toThrow()
  })
})
