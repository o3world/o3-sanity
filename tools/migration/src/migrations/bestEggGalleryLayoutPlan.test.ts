import { expect, it } from 'vitest'
import { planBestEggGalleryLayout, type BestEggGalleryRow } from './bestEggGalleryLayoutPlan'

const fixture: BestEggGalleryRow = {
  _id: 'caseStudy-wp-5803',
  _rev: 'revision',
  _type: 'caseStudy',
  slug: {
    current: 'best-egg',
  },
  story: [
    {
      _key: '10f6027a8e0e',
      _type: 'screenGridSection',
      screens: [
        {
          _key: '980bd5de4a66',
          span: 'wide',
          framing: 'image',
          media: {
            image: {
              asset: {
                _ref: 'image-668bf0e9e446a4fa4e2e30bec61914c901da9cb2-2784x2100-png',
              },
            },
          },
        },
        {
          _key: 'd276fac530b0',
          span: 'standard',
          media: {
            image: {
              asset: {
                _ref: 'image-6b3f9d9f7f9f99324fd0ee7e37dc44b92a46338c-864x1002-png',
              },
            },
          },
        },
        {
          _key: '6fad31ab3b16',
          span: 'standard',
          media: {
            image: {
              asset: {
                _ref: 'image-a2a859554866d5a0c6d8f48f3d83a9c009ac189e-864x1002-png',
              },
            },
          },
        },
        {
          _key: 'f83f1855998d',
          span: 'standard',
          media: {
            image: {
              asset: {
                _ref: 'image-02e5f3c8aabf4b08ccd5d7754b86aea0ee34a7ed-1824x1002-png',
              },
            },
          },
        },
        {
          _key: '7fbe1f51d32b',
          span: 'standard',
          media: {
            image: {
              asset: {
                _ref: 'image-8f7247c644227efbfb2b52916515572396f34921-1260x1500-webp',
              },
            },
          },
        },
      ],
    },
  ],
}

it('changes only the exact gallery layout with a revision guard and preserves its input', () => {
  const before = structuredClone(fixture)
  expect(planBestEggGalleryLayout(fixture)).toEqual({
    id: fixture._id,
    revision: 'revision',
    set: { 'story[_key=="10f6027a8e0e"].layout': 'feature' },
  })
  expect(fixture).toEqual(before)
  const applied = structuredClone(fixture)
  applied.story![0]!.layout = 'feature'
  expect(planBestEggGalleryLayout(applied)).toBeNull()
})

it('preserves draft identity and rejects locked or changed content', () => {
  expect(planBestEggGalleryLayout({ ...fixture, _id: `drafts.${fixture._id}` })?.id).toBe(
    `drafts.${fixture._id}`,
  )
  expect(() => planBestEggGalleryLayout({ ...fixture, migration: { locked: true } })).toThrow(
    'locked',
  )
  for (const patch of [
    { _id: 'other' },
    { _type: 'page' },
    { slug: { current: 'other' } },
    { _rev: '' },
    { story: [] },
    { story: [...fixture.story!, ...fixture.story!] },
  ]) {
    expect(() => planBestEggGalleryLayout({ ...fixture, ...patch })).toThrow()
  }
  for (const change of ['asset', 'order', 'span', 'framing', 'layout', 'key', 'type']) {
    const row = structuredClone(fixture)
    const gallery = row.story![0]!
    if (change === 'asset') gallery.screens![0]!.media!.image!.asset!._ref = 'different'
    if (change === 'order') gallery.screens!.reverse()
    if (change === 'span') gallery.screens![0]!.span = 'standard'
    if (change === 'framing') gallery.screens![0]!.framing = 'plate'
    if (change === 'layout') gallery.layout = 'unexpected'
    if (change === 'key') gallery._key = 'other'
    if (change === 'type') gallery._type = 'other'
    expect(() => planBestEggGalleryLayout(row), change).toThrow()
  }
})
