import { describe, expect, it } from 'vitest'
import {
  planRasterAlignment,
  RASTER_ALIGNMENT_IDS,
  SOLUTIONS_ALIGNMENT_ID,
  type RasterAlignmentRow,
} from './rasterAlignmentPlan'

function page(
  id: string,
  slug: string,
  sections: RasterAlignmentRow['sections'],
): RasterAlignmentRow {
  return { _id: id, _rev: 'revision', _type: 'page', slug: { current: slug }, sections }
}
const home = page('page-seed-index', 'index', [
  {
    _key: '0fb21c7a51ee',
    _type: 'layoutSection',
    columns: 2,
    items: [{ title: 'Authored title' }],
  },
  { _key: 'partners', _type: 'logoWallSection', surface: 'ink', logos: [{ _ref: 'logo' }] },
])
const about = page('page-seed-about', 'about', [
  {
    _key: 'why',
    _type: 'layoutSection',
    width: 'section',
    columns: 2,
    bleed: 'end',
    items: [{ body: 'Authored body' }],
  },
  {
    _key: 'beyond',
    _type: 'layoutSection',
    columns: 3,
    surface: 'bone',
    items: [{ image: { _ref: 'asset' } }],
  },
  { _key: 'team', _type: 'personGridSection', surface: 'white' },
])
const partner = page('page-seed-partners-sanity', 'partners/sanity', [
  { _key: 'brands', _type: 'logoWallSection', surface: 'bone' },
  { _key: 'enables', _type: 'featureGridSection', layout: 'stack' },
])
const engineering = page(
  'page-seed-solutions-software-engineering',
  'solutions/software-engineering',
  [
    { _key: 'overview', _type: 'layoutSection' },
    { _key: 'proof', _type: 'layoutSection' },
  ],
)
const solutions = {
  ...page(SOLUTIONS_ALIGNMENT_ID, 'solutions', [
    {
      _key: 'c88fd5d67474',
      _type: 'heroSection',
      surface: 'white',
      alignment: 'start',
      heading: 'Authored title',
    },
    { _key: 'dddfc2a572a8', _type: 'railPanelsSection', surface: 'ink', layout: 'rail' },
    { _key: 'engagements', _type: 'railPanelsSection', layout: 'cards' },
  ]),
  migration: { locked: true },
}

function applyLocally(row: RasterAlignmentRow, set: Record<string, string | number>) {
  const result = structuredClone(row)
  for (const [path, value] of Object.entries(set)) {
    const match = /^sections\[_key=="([^"]+)"\]\.(\w+)$/.exec(path)!
    result.sections!.find((section) => section._key === match[1])![match[2]!] = value
  }
  return result
}

describe('raster alignment presentation migration', () => {
  it.each([
    [home, { 'sections[_key=="0fb21c7a51ee"].variant': 'brand' }],
    [
      about,
      {
        'sections[_key=="why"].variant': 'prose',
        'sections[_key=="why"].width': 'article',
        'sections[_key=="why"].columns': 1,
        'sections[_key=="why"].bleed': 'none',
        'sections[_key=="beyond"].variant': 'prose',
        'sections[_key=="beyond"].columns': 2,
        'sections[_key=="beyond"].bleed': 'none',
        'sections[_key=="beyond"].surface': 'ink',
        'sections[_key=="team"].surface': 'bone',
      },
    ],
    [
      partner,
      { 'sections[_key=="brands"].surface': 'ink', 'sections[_key=="enables"].layout': 'cards' },
    ],
    [
      engineering,
      {
        'sections[_key=="overview"].variant': 'overview',
        'sections[_key=="proof"].variant': 'prose',
      },
    ],
  ] as const)('plans only the reviewed fields on $0._id and reruns as a no-op', (row, set) => {
    const before = structuredClone(row)
    for (const prefix of ['', 'drafts.']) {
      const version = { ...row, _id: prefix + row._id }
      const plan = planRasterAlignment(version)!
      expect(plan).toMatchObject({ id: version._id, revision: 'revision', set })
      expect(plan.set).toEqual(set)
      expect(planRasterAlignment(applyLocally(version, plan.set))).toBeNull()
    }
    expect(row).toEqual(before)
  })

  it('corrects only the Home draft partner surface and preserves authored content', () => {
    const draft = structuredClone(home)
    draft._id = 'drafts.page-seed-index'
    draft.sections![1]!.surface = 'white'
    const plan = planRasterAlignment(draft)!
    expect(plan.set).toEqual({
      'sections[_key=="0fb21c7a51ee"].variant': 'brand',
      'sections[_key=="partners"].surface': 'ink',
    })
    expect(plan.before).toEqual({
      'sections[_key=="0fb21c7a51ee"].variant': null,
      'sections[_key=="partners"].surface': 'white',
    })
    const updated = applyLocally(draft, plan.set)
    expect(updated.sections![0]!.items).toEqual(home.sections![0]!.items)
    expect(updated.sections![1]!.logos).toEqual(home.sections![1]!.logos)
    expect(planRasterAlignment(updated)).toBeNull()
  })

  it('keeps Solutions separate and requires the scoped lock override for exactly three fields', () => {
    expect(RASTER_ALIGNMENT_IDS).not.toContain(SOLUTIONS_ALIGNMENT_ID)
    expect(() => planRasterAlignment(solutions)).toThrow('migration-locked')
    for (const prefix of ['', 'drafts.']) {
      const version = { ...solutions, _id: prefix + solutions._id }
      const plan = planRasterAlignment(version, true)!
      expect(plan.set).toEqual({
        'sections[_key=="c88fd5d67474"].surface': 'ink',
        'sections[_key=="c88fd5d67474"].alignment': 'center',
        'sections[_key=="dddfc2a572a8"].surface': 'white',
      })
      const updated = applyLocally(version, plan.set)
      expect(updated.migration).toEqual({ locked: true })
      expect(updated.sections![0]!.heading).toBe('Authored title')
      expect(updated.sections![1]!.layout).toBe('rail')
      expect(updated.sections![2]).toEqual(solutions.sections![2])
      expect(planRasterAlignment(updated)).toBeNull()
    }
    expect(() => planRasterAlignment({ ...home, migration: { locked: true } }, true)).toThrow(
      'migration-locked',
    )
  })

  it('refuses changed document identity, missing revisions, slugs, section shapes or presentation values', () => {
    const invalid: RasterAlignmentRow[] = [
      { ...home, _id: 'page-unrelated' },
      { ...home, _type: 'insight' },
      { ...home, _rev: '' },
      { ...home, slug: { current: 'other' } },
      { ...home, sections: [] },
      { ...home, sections: [...home.sections!, home.sections![0]!] },
      { ...home, sections: [{ ...home.sections![0]!, _type: 'featureGridSection' }] },
      { ...home, sections: [{ ...home.sections![0]!, variant: 'unexpected' }] },
      {
        ...solutions,
        sections: [{ ...solutions.sections![0]!, alignment: 'end' }, solutions.sections![1]!],
      },
    ]
    for (const row of invalid) expect(() => planRasterAlignment(row, true)).toThrow()
  })
})
