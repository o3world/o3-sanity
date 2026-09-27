/** The two pages whose marks carry the Figma Dot Circle artwork. */
export const DOT_CIRCLE_PAGE_IDS = ['page-seed-partners-sanity', 'page-seed-solutions'] as const

/** The committed Dot Circle exports, by the icon each one draws. */
export const DOT_CIRCLE_SOURCES = {
  arrow: 'tools/migration/data/seed/assets/figma-current-why-arrow.svg',
  heart: 'tools/migration/data/seed/assets/figma-current-why-heart.svg',
  network: 'tools/migration/data/seed/assets/figma-current-why-network.svg',
  key: 'tools/migration/data/seed/assets/figma-current-engagement-key.svg',
  squad: 'tools/migration/data/seed/assets/figma-current-engagement-squad.svg',
  team: 'tools/migration/data/seed/assets/figma-current-engagement-team.svg',
} as const

export type DotCircleMarkRow = {
  _id: string
  _rev: string
  _type: string
  [field: string]: unknown
}
type ObjectValue = Record<string, unknown>

const isObject = (value: unknown): value is ObjectValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Move each mark drawn from a Dot Circle export to the Dot Circle kind with the
 * matching icon. A transformation of the mark's own fields: the icon comes from
 * the asset the mark already references, and `media` is left in place.
 */
export function planDotCircleMarks(row: DotCircleMarkRow, icons: Readonly<Record<string, string>>) {
  const id = row._id.replace(/^drafts\./, '')
  if (!(DOT_CIRCLE_PAGE_IDS as readonly string[]).includes(id) || row._type !== 'page' || !row._rev)
    throw new Error(`Unexpected document identity: ${row._id}`)
  const before: ObjectValue = {}
  const set: ObjectValue = {}

  const visit = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      const keys = value.map((item) => (isObject(item) ? item._key : undefined))
      for (const [index, item] of value.entries()) {
        if (!isObject(item)) continue
        const key = keys[index]
        if (typeof key !== 'string' || !/^[\w-]+$/.test(key) || keys.indexOf(key) !== index)
          throw new Error(`Invalid or duplicate key under ${row._id}.${path}`)
        visit(item, `${path}[_key=="${key}"]`)
      }
      return
    }
    if (!isObject(value)) return
    if (value._type === 'mark') {
      const ref = (value.media as { image?: { asset?: { _ref?: unknown } } } | undefined)?.image
        ?.asset?._ref
      const icon = typeof ref === 'string' ? icons[ref] : undefined
      if (!icon) return
      if (value.kind === 'dotCircle') {
        if (value.icon !== icon)
          throw new Error(
            `Dot Circle at ${row._id}.${path} holds ${String(value.icon)}, not ${icon}`,
          )
        return
      }
      if (value.kind !== 'image') throw new Error(`Unexpected mark kind at ${row._id}.${path}`)
      before[`${path}.kind`] = value.kind
      before[`${path}.icon`] = value.icon ?? null
      set[`${path}.kind`] = 'dotCircle'
      set[`${path}.icon`] = icon
      return
    }
    for (const [field, child] of Object.entries(value))
      if (!field.startsWith('_')) visit(child, path ? `${path}.${field}` : field)
  }

  visit(row, '')
  return Object.keys(set).length ? { id: row._id, revision: row._rev, before, set } : null
}
