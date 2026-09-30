/**
 * What `retireUnrenderedFields` unsets on one document: a `quoteSection`'s
 * `eyebrow`, and the `icon` on each feature of a `featureGridSection`. Neither
 * field is in the schema and no renderer reads either.
 *
 * The walk covers the whole document rather than a list of block arrays, so a
 * block is found wherever the document stores it. Everything else is left
 * alone — a hero's `eyebrow` or a button's `icon` is a different field.
 *
 * `migration.locked` is not read. The plan only removes values the document
 * already holds; nothing comes in from outside it.
 */
export type RetireRow = {
  _id: string
  _rev: string
  _type: string
  [field: string]: unknown
}

export type RetirePlan = {
  id: string
  /** The revision the plan was read at; the patch is guarded on it. */
  revision: string
  /** Patch paths, addressed by `_key` wherever the array member has one. */
  unset: string[]
  /** What each path holds now, for the report. */
  removed: Record<string, unknown>
}

type Node = Record<string, unknown>

const isNode = (value: unknown): value is Node =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

/** `[_key=="k"]`, or `[3]` for a member with no key. */
const member = (item: unknown, index: number) =>
  isNode(item) && typeof item._key === 'string' ? `[_key=="${item._key}"]` : `[${index}]`

export function planRetireUnrenderedFields(row: RetireRow): RetirePlan | null {
  if (!row._id || typeof row._rev !== 'string' || !row._rev.trim())
    throw new Error(`Expected a revisioned document, got ${row._id || 'one with no _id'}`)

  const removed: Record<string, unknown> = {}

  const walk = (node: unknown, path: string): void => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${path}${member(item, index)}`))
      return
    }
    if (!isNode(node)) return

    if (node._type === 'quoteSection' && 'eyebrow' in node)
      removed[`${path}.eyebrow`] = node.eyebrow
    if (node._type === 'featureGridSection' && Array.isArray(node.features)) {
      node.features.forEach((feature, index) => {
        if (isNode(feature) && 'icon' in feature)
          removed[`${path}.features${member(feature, index)}.icon`] = feature.icon
      })
    }

    for (const [field, value] of Object.entries(node))
      walk(value, path ? `${path}.${field}` : field)
  }

  walk(row, '')

  const unset = Object.keys(removed)
  return unset.length ? { id: row._id, revision: row._rev, unset, removed } : null
}
