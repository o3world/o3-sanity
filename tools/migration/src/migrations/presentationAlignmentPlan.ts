import { isDeepStrictEqual } from 'node:util'

type ObjectValue = Record<string, unknown>
export type PresentationRow = ObjectValue & {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
}

const MARKS = {
  why: [
    ['why-both', 'why-arrow'],
    ['why-scale', 'why-network'],
    ['why-stay', 'why-heart'],
  ],
  enables: [
    ['en-speed', 'outcome-speed'],
    ['en-channels', 'outcome-publish'],
    ['en-collab', 'outcome-collaboration'],
    ['en-monitoring', 'outcome-performance'],
    ['en-governance', 'outcome-governance'],
  ],
  engagements: [
    ['eng-full', 'engagement-key'],
    ['eng-squad', 'engagement-squad'],
    ['eng-embedded', 'engagement-team'],
  ],
} as const

export const PRESENTATION_ASSET_KEYS = Object.values(MARKS).flatMap((items) =>
  items.map(([, key]) => key),
)
export function readPresentationAssets(value: unknown): Record<string, string> {
  const input = object(value, 'assets')
  if (Object.keys(input).length !== PRESENTATION_ASSET_KEYS.length)
    throw new Error('Expected exactly the eleven reviewed illustration assets')
  const assets: Record<string, string> = {}
  for (const key of PRESENTATION_ASSET_KEYS) {
    const ref = input[key]
    if (typeof ref !== 'string' || !/^image-[a-f0-9]{40}-[1-9][0-9]*x[1-9][0-9]*-svg$/.test(ref))
      throw new Error(`Invalid illustration asset: ${key}`)
    assets[key] = ref
  }
  return assets
}

const CROPS = [
  {
    id: '1adeb7ac-ce23-469d-86eb-ec6c4e6404d4',
    name: 'Cencora',
    asset: 'image-55d9985b53b1e04ca118fa2b8854d20a329f32d7-921x570-webp',
    crop: {
      _type: 'sanity.imageCrop',
      left: 0.21606948968512488,
      right: 0.21606948968512488,
      top: 0.4298245614035088,
      bottom: 0.4298245614035088,
    },
  },
  {
    id: '2fd7e788-2671-41f9-994d-7ea336db13c7',
    name: 'Essity',
    asset: 'image-b0b44ade94dd026f1dcc435e8b93dbd674ac8993-921x570-webp',
    crop: {
      _type: 'sanity.imageCrop',
      left: 0.28013029315960913,
      right: 0.28013029315960913,
      top: 0.4052631578947368,
      bottom: 0.4070175438596491,
    },
  },
  {
    id: 'b0e4e6a4-9225-47fd-b87c-02304bc83688',
    name: 'AmFam',
    asset: 'image-b42b1199a726124f20ffefeb144fc906ebab46ef-921x570-webp',
    crop: {
      _type: 'sanity.imageCrop',
      left: 0.21281216069489686,
      right: 0.21281216069489686,
      top: 0.35789473684210527,
      bottom: 0.35964912280701755,
    },
  },
] as const

const PRESERVED_DRAFT_LOGOS: Record<string, string> = {
  '1adeb7ac-ce23-469d-86eb-ec6c4e6404d4':
    'image-8dd12e0ef5c523517b30765d87c3f832ebe3fc5c-921x570-png',
  '2fd7e788-2671-41f9-994d-7ea336db13c7':
    'image-b6ab1621b0e6d0100580702884b71162e31d48d6-495x162-png',
  'b0e4e6a4-9225-47fd-b87c-02304bc83688':
    'image-4f33ace175f577f077ceb9e631084c91bdc30bad-4096x2150-png',
}

const GALLERIES: Record<
  string,
  { slug: string; screens: readonly (readonly [string, string, string])[] }
> = {
  'caseStudy-wp-5803': {
    slug: 'best-egg',
    screens: [
      [
        '8ff06278311d',
        'af0de3092aa7',
        'image-715dec532b4d49324981a33a92e0a7a751cda830-3744x2100-png',
      ],
      [
        '10f6027a8e0e',
        '980bd5de4a66',
        'image-668bf0e9e446a4fa4e2e30bec61914c901da9cb2-2784x2100-png',
      ],
    ],
  },
  'caseStudy-wp-5804': {
    slug: 'vertex',
    screens: [
      ['screens-0', 'media-1', 'image-de27dc2c688a8e6b4801b9d116a9f0d6c4f8f989-2500x1448-png'],
    ],
  },
  'caseStudy-wp-5805': {
    slug: 'caron',
    screens: [
      ['screens-0', 'media-1', 'image-46f9ef486c755bc9d1501fa248684addff2bdbcd-3744x2100-png'],
    ],
  },
}
const PAGES: Record<string, string> = {
  'page-seed-partners-sanity': 'partners/sanity',
  'page-seed-solutions': 'solutions',
  'page-seed-contact': 'contact',
  'page-seed-index': 'index',
  'page-seed-about': 'about',
}
export const PRESENTATION_IDS = [
  ...Object.keys(PAGES),
  ...Object.keys(GALLERIES),
  ...CROPS.map(({ id }) => id),
]
export const PRESENTATION_EXISTING_ASSETS = [
  ...CROPS.map(({ asset }) => asset),
  ...Object.values(GALLERIES).flatMap(({ screens }) => screens.map(([, , asset]) => asset)),
]

function object(value: unknown, label: string): ObjectValue {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error(`Expected object: ${label}`)
  return value as ObjectValue
}
function keyed(value: unknown, key: string, type: string): ObjectValue {
  if (!Array.isArray(value)) throw new Error(`Expected array containing ${key}`)
  const matches = value.filter((item) => item?._key === key)
  if (matches.length !== 1 || matches[0]?._type !== type)
    throw new Error(`Expected exactly one ${type} with key ${key}`)
  return object(matches[0], key)
}
function assetRef(value: unknown): unknown {
  return object(object(value, 'image').asset, 'asset')._ref
}

/** Only reviewed keyed presentation fields are patched. Editorial values and array order survive. */
export function planPresentationAlignment(
  row: PresentationRow,
  assets: Record<string, string>,
  allowLockedSolutions = false,
) {
  const id = row._id.replace(/^drafts\./, '')
  if (!PRESENTATION_IDS.includes(id) || !row._rev)
    throw new Error(`Unexpected identity or revision: ${row._id}`)
  const expectedType = Object.hasOwn(PAGES, id)
    ? 'page'
    : Object.hasOwn(GALLERIES, id)
      ? 'caseStudy'
      : 'client'
  if (row._type !== expectedType) throw new Error(`Unexpected document type: ${row._id}`)
  const slug = PAGES[id] ?? GALLERIES[id]?.slug
  if (slug && row.slug?.current !== slug) throw new Error(`Unexpected slug: ${row._id}`)
  const set: ObjectValue = {}
  const before: ObjectValue = {}
  const skipped: string[] = []
  const change = (
    path: string,
    current: unknown,
    target: unknown,
    accepted: readonly unknown[],
  ) => {
    if (isDeepStrictEqual(current, target)) return
    if (!accepted.some((value) => isDeepStrictEqual(value, current)))
      throw new Error(`Unexpected authored value at ${row._id}.${path}`)
    before[path] = current ?? null
    set[path] = target
  }
  const section = (key: string, type: string) => keyed(row.sections, key, type)
  const marks = (
    sectionKey: keyof typeof MARKS,
    collection: 'features' | 'panels',
    oldKind: string,
  ) => {
    const parent = section(
      sectionKey,
      collection === 'features' ? 'featureGridSection' : 'railPanelsSection',
    )
    for (const [key, assetKey] of MARKS[sectionKey]) {
      const item = keyed(parent[collection], key, collection === 'features' ? 'feature' : 'panel')
      const mark = object(item.mark, 'mark')
      if (mark._type !== 'mark') throw new Error(`Unexpected mark type: ${row._id}/${key}`)
      if (!assets[assetKey]) throw new Error(`Missing illustration asset: ${assetKey}`)
      const path = `sections[_key=="${sectionKey}"].${collection}[_key=="${key}"].mark`
      const media = {
        _type: 'figure',
        image: { _type: 'image', asset: { _type: 'reference', _ref: assets[assetKey] } },
        alt: '',
      }
      // Adjacent text carries the meaning; these illustrations are decorative.
      change(`${path}.kind`, mark.kind, 'image', [oldKind])
      change(`${path}.media`, mark.media, media, [undefined, null])
    }
  }
  if (id === 'page-seed-partners-sanity') {
    marks('why', 'features', 'disc')
    marks('enables', 'features', 'disc')
  } else if (id === 'page-seed-solutions') {
    marks('engagements', 'panels', 'orb')
    change(
      'sections[_key=="engagements"].surface',
      section('engagements', 'railPanelsSection').surface,
      'bone',
      ['paper'],
    )
    change(
      'sections[_key=="engagements"].decoration',
      section('engagements', 'railPanelsSection').decoration,
      'molecule',
      [undefined, null, 'orbs'],
    )
  } else if (id === 'page-seed-about') {
    change(
      'sections[_key=="hero"].surface',
      section('hero', 'heroSection').surface,
      'bone',
      row._id === 'drafts.page-seed-about' ? ['paper', 'ink'] : ['paper'],
    )
  } else if (id === 'page-seed-contact') {
    change(
      'sections[_key=="inquiry"].decoration',
      section('inquiry', 'formSection').decoration,
      'molecule',
      ['orbs'],
    )
  } else if (id === 'page-seed-index') {
    const cta = section('cta', 'ctaSection')
    const target = 'But enough about us.\nTell us about you.'
    if (
      typeof cta.heading !== 'string' ||
      cta.heading.replace(/\s+/g, ' ').trim() !== target.replace(/\s+/g, ' ')
    )
      throw new Error(`Home CTA words have changed: ${row._id}`)
    change('sections[_key=="cta"].heading', cta.heading, target, [cta.heading])
  } else if (Object.hasOwn(GALLERIES, id)) {
    for (const [sectionKey, key, asset] of GALLERIES[id]!.screens) {
      const grid = keyed(row.story, sectionKey, 'screenGridSection')
      const screen = keyed(grid.screens, key, 'screen')
      if (assetRef(object(screen.media, 'media').image) !== asset)
        throw new Error(`Gallery asset changed: ${row._id}/${key}`)
      change(
        `story[_key=="${sectionKey}"].screens[_key=="${key}"].framing`,
        screen.framing,
        'image',
        [undefined, null, 'plate'],
      )
    }
  } else {
    const spec = CROPS.find((crop) => crop.id === id)!
    const logo = object(row.logo, 'logo')
    const currentAsset = assetRef(logo)
    if (row._id.startsWith('drafts.') && currentAsset === PRESERVED_DRAFT_LOGOS[id]) {
      skipped.push(
        `Preserved reviewed draft logo with different artwork: ${row._id} (${currentAsset})`,
      )
    } else {
      if (currentAsset !== spec.asset) throw new Error(`Logo asset changed: ${row._id}`)
      change('logo.crop', logo.crop, spec.crop, [undefined, null])
    }
  }
  if (
    Object.keys(set).length &&
    row.migration?.locked &&
    !(id === 'page-seed-solutions' && allowLockedSolutions)
  )
    throw new Error(
      `${row._id} is migration-locked; only the scoped Solutions override is supported`,
    )
  return { id: row._id, revision: row._rev, before, set, skipped }
}
