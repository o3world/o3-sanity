type Setting = string | number | null | undefined
/** Section key, schema type, field, accepted prior values, target value. */
type Rule = readonly [string, string, string, readonly Setting[], string | number]
type Page = { slug: string; rules: readonly Rule[] }

const PAGES: Record<string, Page> = {
  'page-seed-index': {
    slug: 'index',
    rules: [['0fb21c7a51ee', 'layoutSection', 'variant', [undefined, null, 'standard'], 'brand']],
  },
  'page-seed-about': {
    slug: 'about',
    rules: [
      ['why', 'layoutSection', 'variant', [undefined, null, 'standard'], 'prose'],
      ['why', 'layoutSection', 'width', ['section'], 'article'],
      ['why', 'layoutSection', 'columns', [2], 1],
      ['why', 'layoutSection', 'bleed', ['end'], 'none'],
      ['beyond', 'layoutSection', 'variant', [undefined, null, 'standard'], 'prose'],
      ['beyond', 'layoutSection', 'columns', [3], 2],
      ['beyond', 'layoutSection', 'bleed', [undefined, null], 'none'],
      ['beyond', 'layoutSection', 'surface', ['bone'], 'ink'],
      ['team', 'personGridSection', 'surface', ['white'], 'bone'],
    ],
  },
  'page-seed-partners-sanity': {
    slug: 'partners/sanity',
    rules: [
      ['brands', 'logoWallSection', 'surface', ['bone'], 'ink'],
      ['enables', 'featureGridSection', 'layout', ['stack'], 'cards'],
    ],
  },
  'page-seed-solutions-software-engineering': {
    slug: 'solutions/software-engineering',
    rules: [
      ['overview', 'layoutSection', 'variant', [undefined, null, 'standard'], 'overview'],
      ['proof', 'layoutSection', 'variant', [undefined, null, 'standard'], 'prose'],
    ],
  },
  'page-seed-solutions': {
    slug: 'solutions',
    rules: [
      ['c88fd5d67474', 'heroSection', 'surface', ['white'], 'ink'],
      ['c88fd5d67474', 'heroSection', 'alignment', ['start'], 'center'],
      ['dddfc2a572a8', 'railPanelsSection', 'surface', ['ink'], 'white'],
    ],
  },
}

export const RASTER_ALIGNMENT_IDS = Object.keys(PAGES).filter((id) => id !== 'page-seed-solutions')
export const SOLUTIONS_ALIGNMENT_ID = 'page-seed-solutions'

export type RasterAlignmentRow = {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
  sections?: ({ _key?: string; _type: string } & Record<string, unknown>)[]
}

/** Plans only the reviewed presentation fields; content and section arrays are never replaced. */
export function planRasterAlignment(row: RasterAlignmentRow, allowLockedSolutions = false) {
  const id = row._id.replace(/^drafts\./, '')
  if (!Object.hasOwn(PAGES, id) || row._type !== 'page' || !row._rev)
    throw new Error(`Unexpected page identity or revision: ${row._id}`)
  const page = PAGES[id]!
  if (row.slug?.current !== page.slug) throw new Error(`Unexpected slug on ${row._id}`)
  const rules: readonly Rule[] =
    row._id === 'drafts.page-seed-index'
      ? [...page.rules, ['partners', 'logoWallSection', 'surface', ['white'], 'ink']]
      : page.rules
  const set: Record<string, string | number> = {}
  const before: Record<string, unknown> = {}
  for (const [key, type, field, from, to] of rules) {
    const matches = row.sections?.filter((section) => section._key === key) ?? []
    if (matches.length !== 1 || matches[0]?._type !== type)
      throw new Error(`Expected exactly one ${type} section ${key} on ${row._id}`)
    const current = matches[0][field]
    if (current === to) continue
    if (!from.includes(current as Setting))
      throw new Error(`Unexpected ${key}.${field} on ${row._id}: ${JSON.stringify(current)}`)
    const path = `sections[_key=="${key}"].${field}`
    before[path] = current ?? null
    set[path] = to
  }
  if (!Object.keys(set).length) return null
  if (row.migration?.locked && !(id === SOLUTIONS_ALIGNMENT_ID && allowLockedSolutions))
    throw new Error(`${row._id} is migration-locked`)
  return { id: row._id, revision: row._rev, before, set }
}
