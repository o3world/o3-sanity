type Section = { _type: string; _key?: string; [field: string]: unknown }

export type AboutCompositionRow = {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
  sections?: Section[]
}

export type AboutCompositionAssets = { background: string; logo: string; badge: string }

export function readAboutCompositionAssets(value: unknown): AboutCompositionAssets {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected background, logo and badge asset references')
  const assets = value as Record<string, unknown>
  for (const field of ['background', 'logo', 'badge']) {
    const ref = assets[field]
    if (typeof ref !== 'string' || !/^image-[a-f0-9]{40}-\d+x\d+-(png|svg)$/.test(ref))
      throw new Error(`Invalid ${field} image asset reference`)
  }
  return assets as AboutCompositionAssets
}

const image = (ref: string) => ({ _type: 'image', asset: { _type: 'reference', _ref: ref } })
const PHOTO_KEY = '6623bfef31c8'
const PHOTO_ASSET = 'image-e841d5ab8f0617e66cba08e02dcce69b3ae03dab-2000x1333-jpg'

/** Current About composition, preserving each version's own authored sections and figure. */
export function planAboutComposition(row: AboutCompositionRow, input: AboutCompositionAssets) {
  const assets = readAboutCompositionAssets(input)
  if (
    !['page-seed-about', 'drafts.page-seed-about'].includes(row._id) ||
    row._type !== 'page' ||
    row.slug?.current !== 'about' ||
    !row._rev
  )
    throw new Error('Expected the About page or its draft with a revision')
  if (row.migration?.locked)
    throw new Error('About is migration-locked; its new composition needs explicit reconciliation')
  const sections = row.sections ?? []
  if (
    sections.some((section) => !section._key) ||
    new Set(sections.map((section) => section._key)).size !== sections.length
  )
    throw new Error('Expected unique keyed sections')
  const get = (key: string, type: string) => {
    const section = sections.find((item) => item._key === key)
    if (!section || section._type !== type) throw new Error(`Expected ${key} ${type}`)
    return section
  }
  const hero = get('hero', 'heroSection')
  const why = get('why', 'layoutSection')
  const values = get('optimize', 'railPanelsSection')
  const beyond = get('beyond', 'layoutSection')
  const team = get('team', 'personGridSection')
  const cta = get('cta', 'ctaSection')
  if (sections[0] !== hero || sections.at(-1) !== cta)
    throw new Error('Expected opening hero and closing CTA')
  if (!Array.isArray(why.items)) throw new Error('Expected Why O3 items')
  const items = why.items as Section[]
  if (items.filter((item) => item._key === 'why-body' && item._type === 'richText').length !== 1)
    throw new Error('Expected the authored Why O3 rich text')
  const photo = sections.find((section) => section._key === 'team-photo')
  const philly = sections.find((section) => section._key === 'philly-made')
  if (photo || philly) {
    if (
      photo?._type !== 'mediaSection' ||
      photo.variant !== 'overlap' ||
      philly?._type !== 'mediaSection' ||
      philly.variant !== 'feature' ||
      (photo.media as Section | undefined)?._key !== PHOTO_KEY ||
      items.some((item) => item._key === PHOTO_KEY)
    )
      throw new Error('Partial or conflicting About composition; reconcile before continuing')
    return null
  }
  const figures = items.filter((item) => item._type === 'figure')
  const figure = figures[0]
  if (
    figures.length !== 1 ||
    figure?._key !== PHOTO_KEY ||
    (figure.image as { asset?: { _ref?: string } } | undefined)?.asset?._ref !== PHOTO_ASSET
  )
    throw new Error('Expected the existing keyed O3 team figure')
  const known = new Set([hero, why, values, beyond, team, cta])
  return {
    id: row._id,
    revision: row._rev,
    set: {
      sections: [
        hero,
        {
          _key: 'team-photo',
          _type: 'mediaSection',
          variant: 'overlap',
          width: 'section',
          surface: 'white',
          media: figure,
        },
        { ...why, items: items.filter((item) => item !== figure) },
        {
          _key: 'philly-made',
          _type: 'mediaSection',
          variant: 'feature',
          surface: 'white',
          heading: 'Philly made.',
          // Figma 4061:50294, including its intentional line separator.
          subheading:
            'We’re proud of where we started and it shows up in how we work. Straightforward conversations, practical thinking, zero pretense.\u2028A lot of grit. A little edge.',
          media: { _type: 'figure', alt: '', image: image(assets.background) },
          logo: image(assets.logo),
          badge: image(assets.badge),
        },
        values,
        ...sections.filter((section) => !known.has(section)),
        beyond,
        team,
        cta,
      ],
    },
  }
}
