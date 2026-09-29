/** Current Ironman row: Figma 3578:29877 (821⅓px) + 3578:29880 (394⅔px). */
const GRID_KEY = 'screens-0'
const EXPECTED_SCREENS = [
  ['media-2', 'image-b350d0f1e1c5610cf332d40060c2defab636d639-1776x810-png', 'standard'],
  ['media-3', 'image-11e5532f1370548a6466623cae017b93c5bd7017-1216x684-png', 'standard'],
  ['figma-lionel-banner', 'image-9d7054de0622fc46f30978169a926c014e8d4e8f-2496x668-png', 'wide'],
  ['media-4', 'image-4aaf2ec6621051e440c92eacaf24509445244125-1216x684-png', 'twoThirds'],
  ['media-5', 'image-8bb1fae8fdd6a6f0431ad82d825b12d848492762-1216x684-png', 'third'],
] as const

export type IronmanGridRow = {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
  story?: {
    _key?: string
    _type: string
    layout?: string | null
    screens?: {
      _key?: string
      span?: string
      media?: { image?: { asset?: { _ref?: string } } }
    }[]
  }[]
}

/** Proposal only: the locked document and replacement asset decisions remain untouched. */
export function planIronmanGridSpans(row: IronmanGridRow) {
  if (
    !['caseStudy-wp-10028', 'drafts.caseStudy-wp-10028'].includes(row._id) ||
    row._type !== 'caseStudy' ||
    row.slug?.current !== 'case-studies-ironman-digital-experience-drupal-acquia' ||
    !row._rev?.trim()
  )
    throw new Error('Expected the revisioned Ironman case study or its draft')
  const matches = row.story?.filter((section) => section._key === GRID_KEY) ?? []
  const grid = matches[0]
  if (
    matches.length !== 1 ||
    grid?._type !== 'screenGridSection' ||
    (grid.layout != null && grid.layout !== 'grid') ||
    grid.screens?.length !== EXPECTED_SCREENS.length
  )
    throw new Error('Ironman grid identity or layout changed')
  const set: Record<string, string> = {}
  for (const [index, [key, ref, desired]] of EXPECTED_SCREENS.entries()) {
    const screen = grid.screens![index]!
    if (
      screen._key !== key ||
      screen.media?.image?.asset?._ref !== ref ||
      (screen.span !== desired && (index < 3 || screen.span !== 'standard'))
    )
      throw new Error(`Ironman screen ${key} assets, order, or span changed`)
    if (screen.span !== desired)
      set[`story[_key=="${GRID_KEY}"].screens[_key=="${key}"].span`] = desired
  }
  if (!Object.keys(set).length) return null
  return {
    id: row._id,
    revision: row._rev,
    set,
    blocked: [
      ...(row.migration?.locked
        ? ['Migration-locked: external Figma values cannot be applied.']
        : []),
      'Both current assets are 1216×684. Prepare source exports matching 821⅓×334 and 394⅔×334 slots before claiming visual parity.',
    ],
  }
}
