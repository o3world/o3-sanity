import { describe, expect, it } from 'vitest'
import {
  planPresentationAlignment,
  readPresentationAssets,
  PRESENTATION_ASSET_KEYS,
  type PresentationRow,
} from './presentationAlignmentPlan'

const assets = readPresentationAssets(
  Object.fromEntries(
    PRESENTATION_ASSET_KEYS.map((key, index) => [
      key,
      `image-${String(index).padStart(40, '0')}-66x66-svg`,
    ]),
  ),
)
const page = (name: string, sections: unknown[]): PresentationRow => ({
  _id: `page-seed-${name}`,
  _rev: 'revision-before',
  _type: 'page',
  slug: { current: name === 'partners-sanity' ? 'partners/sanity' : name },
  sections,
})
const feature = (key: string, kind = 'disc') => ({
  _key: key,
  _type: 'feature',
  heading: 'Editor title',
  body: 'Editor body',
  mark: { _type: 'mark', kind },
})
const partner = () =>
  page('partners-sanity', [
    {
      _key: 'why',
      _type: 'featureGridSection',
      features: ['why-both', 'why-scale', 'why-stay'].map((key) => feature(key)),
    },
    {
      _key: 'enables',
      _type: 'featureGridSection',
      features: ['en-speed', 'en-channels', 'en-collab', 'en-monitoring', 'en-governance'].map(
        (key) => feature(key),
      ),
    },
  ])
const solutions = () => ({
  ...page('solutions', [
    {
      _key: 'engagements',
      _type: 'railPanelsSection',
      surface: 'paper',
      panels: ['eng-full', 'eng-squad', 'eng-embedded'].map((key) => ({
        ...feature(key, 'orb'),
        _type: 'panel',
        mark: { _type: 'mark', kind: 'orb', state: 'working', paused: false },
        button: { label: 'Editorial button' },
      })),
    },
  ]),
  migration: { locked: true },
})
const client = (): PresentationRow => ({
  _id: '1adeb7ac-ce23-469d-86eb-ec6c4e6404d4',
  _rev: 'client-rev',
  _type: 'client',
  name: 'Cencora',
  logo: {
    _type: 'image',
    asset: {
      _type: 'reference',
      _ref: 'image-55d9985b53b1e04ca118fa2b8854d20a329f32d7-921x570-webp',
    },
  },
})

/** Apply Sanity's keyed set shape to a clone, so rerun tests exercise actual planned paths. */
function applied(row: PresentationRow, set: Record<string, unknown>): PresentationRow {
  const next = structuredClone(row)
  for (const [path, value] of Object.entries(set)) {
    const parts = path.split('.')
    let cursor: Record<string, unknown> = next
    for (const part of parts.slice(0, -1)) {
      const match = /^(\w+)\[_key=="([^"]+)"\]$/.exec(part)
      cursor = match
        ? (cursor[match[1]!] as Record<string, unknown>[]).find((item) => item._key === match[2])!
        : (cursor[part] as Record<string, unknown>)
    }
    cursor[parts.at(-1)!] = structuredClone(value)
  }
  return next
}

describe('presentation alignment', () => {
  it('patches only Partner mark kind/media, keeping copy, order, and document revision', () => {
    const row = partner()
    const before = structuredClone(row)
    const plan = planPresentationAlignment(row, assets)
    expect(Object.keys(plan.set)).toHaveLength(16)
    expect(Object.keys(plan.set).every((key) => /\.mark\.(kind|media)$/.test(key))).toBe(true)
    expect(plan.revision).toBe('revision-before')
    expect(row).toEqual(before)
    const next = applied(row, plan.set)
    expect(planPresentationAlignment(next, assets).set).toEqual({})
    expect((next.sections as { features: unknown[] }[])[0]!.features[0]).toMatchObject({
      heading: 'Editor title',
      body: 'Editor body',
    })
  })

  it('requires the scoped Solutions override and preserves the lock and other mark settings', () => {
    const row = solutions()
    expect(() => planPresentationAlignment(row, assets)).toThrow('migration-locked')
    const plan = planPresentationAlignment(row, assets, true)
    expect(plan.set['sections[_key=="engagements"].decoration']).toBe('molecule')
    expect(plan.set['sections[_key=="engagements"].surface']).toBe('bone')
    const next = applied(row, plan.set)
    expect(next.migration).toEqual({ locked: true })
    expect((next.sections as { panels: unknown[] }[])[0]!.panels[0]).toMatchObject({
      mark: { kind: 'image', state: 'working', paused: false },
      button: { label: 'Editorial button' },
    })
    expect(planPresentationAlignment(next, assets).set).toEqual({})
  })

  it('never lets the Solutions override bypass another document lock', () => {
    expect(() =>
      planPresentationAlignment({ ...partner(), migration: { locked: true } }, assets, true),
    ).toThrow('migration-locked')
  })

  it('only changes Contact decoration and About surface', () => {
    const contact = page('contact', [
      {
        _key: 'inquiry',
        _type: 'formSection',
        decoration: 'orbs',
        heading: 'Keep me',
        reasons: ['New work'],
      },
    ])
    expect(planPresentationAlignment(contact, assets).set).toEqual({
      'sections[_key=="inquiry"].decoration': 'molecule',
    })
    const about = page('about', [
      { _key: 'hero', _type: 'heroSection', surface: 'paper', headlineLines: ['Keep me'] },
    ])
    expect(planPresentationAlignment(about, assets).set).toEqual({
      'sections[_key=="hero"].surface': 'bone',
    })
  })

  it('accepts the reviewed About draft ink but rejects an unexpected published ink', () => {
    const about = page('about', [{ _key: 'hero', _type: 'heroSection', surface: 'ink' }])
    expect(() => planPresentationAlignment(about, assets)).toThrow('Unexpected authored value')
    expect(
      planPresentationAlignment({ ...about, _id: 'drafts.page-seed-about' }, assets).set,
    ).toEqual({ 'sections[_key=="hero"].surface': 'bone' })
  })

  it('changes only Home CTA whitespace and never its authored body or hero', () => {
    const row = page('index', [
      { _key: 'hero', _type: 'heroSection', headlineLines: ['Protected'] },
      {
        _key: 'cta',
        _type: 'ctaSection',
        heading: 'But enough about us. Tell us about you.',
        body: "Keep what's in the way",
      },
    ])
    const plan = planPresentationAlignment(row, assets)
    expect(plan.set).toEqual({
      'sections[_key=="cta"].heading': 'But enough about us.\nTell us about you.',
    })
    expect(planPresentationAlignment(applied(row, plan.set), assets).set).toEqual({})
    const changed = applied(row, { 'sections[_key=="cta"].heading': 'A different editor headline' })
    expect(() => planPresentationAlignment(changed, assets)).toThrow('words have changed')
  })

  it('crops the exact published logo without replacing its image or metadata', () => {
    const row = client()
    const plan = planPresentationAlignment(row, assets)
    expect(Object.keys(plan.set)).toEqual(['logo.crop'])
    expect(plan.set['logo.crop']).toMatchObject({
      _type: 'sanity.imageCrop',
      left: 0.21606948968512488,
    })
    expect(planPresentationAlignment(applied(row, plan.set), assets).set).toEqual({})
  })

  it('reports the known different draft artwork and refuses any unexpected logo asset or crop', () => {
    const row = client()
    row._id = `drafts.${row._id}`
    row.logo = { asset: { _ref: 'image-8dd12e0ef5c523517b30765d87c3f832ebe3fc5c-921x570-png' } }
    const plan = planPresentationAlignment(row, assets)
    expect(plan.set).toEqual({})
    expect(plan.skipped).toHaveLength(1)
    row.logo = { asset: { _ref: 'image-unexpected' } }
    expect(() => planPresentationAlignment(row, assets)).toThrow('Logo asset changed')
    expect(() =>
      planPresentationAlignment(
        { ...client(), logo: { ...(client().logo as object), crop: { left: 0.1 } } },
        assets,
      ),
    ).toThrow('Unexpected authored value')
  })

  it('only changes framing for the exact selected image in an existing gallery', () => {
    const row: PresentationRow = {
      _id: 'caseStudy-wp-5805',
      _rev: 'gallery-rev',
      _type: 'caseStudy',
      slug: { current: 'caron' },
      story: [
        {
          _key: 'screens-0',
          _type: 'screenGridSection',
          screens: [
            {
              _key: 'media-1',
              _type: 'screen',
              tone: 'bone',
              span: 'wide',
              media: {
                alt: 'Keep alt',
                image: {
                  asset: { _ref: 'image-46f9ef486c755bc9d1501fa248684addff2bdbcd-3744x2100-png' },
                },
              },
            },
          ],
        },
      ],
    }
    const plan = planPresentationAlignment(row, assets)
    expect(plan.set).toEqual({
      'story[_key=="screens-0"].screens[_key=="media-1"].framing': 'image',
    })
    expect(planPresentationAlignment(applied(row, plan.set), assets).set).toEqual({})
    const changed = applied(row, {
      'story[_key=="screens-0"].screens[_key=="media-1"].media.image.asset._ref': 'new-image',
    })
    expect(() => planPresentationAlignment(changed, assets)).toThrow('Gallery asset changed')
  })

  it('refuses duplicate keyed items, unexpected prior mark kinds, and existing authored media', () => {
    const duplicate = partner()
    const features = (duplicate.sections as { features: unknown[] }[])[0]!.features
    features.push(structuredClone(features[0]))
    expect(() => planPresentationAlignment(duplicate, assets)).toThrow('exactly one')
    const changed = applied(partner(), {
      'sections[_key=="why"].features[_key=="why-both"].mark.kind': 'orb',
    })
    expect(() => planPresentationAlignment(changed, assets)).toThrow('Unexpected authored value')
    const authored = applied(partner(), {
      'sections[_key=="why"].features[_key=="why-both"].mark.media': { alt: 'Editor asset' },
    })
    expect(() => planPresentationAlignment(authored, assets)).toThrow('Unexpected authored value')
  })

  it('validates identity, slug, revision and illustration reference shape', () => {
    expect(() => planPresentationAlignment({ ...partner(), _id: 'other' }, assets)).toThrow(
      'identity',
    )
    expect(() => planPresentationAlignment({ ...partner(), _rev: '' }, assets)).toThrow('revision')
    expect(() =>
      planPresentationAlignment({ ...partner(), slug: { current: 'other' } }, assets),
    ).toThrow('slug')
    expect(() => readPresentationAssets({ ...assets, 'why-arrow': 'not-an-asset' })).toThrow(
      'Invalid illustration',
    )
    expect(() => readPresentationAssets({ ...assets, extra: 'asset' })).toThrow('exactly')
  })
})
