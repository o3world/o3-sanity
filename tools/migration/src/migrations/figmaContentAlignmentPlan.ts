import { isDeepStrictEqual } from 'node:util'
import manifest from './figmaContentAlignment.json'

export type ContentRow = {
  _id: string
  _rev: string
  _type: string
  slug?: { current?: string }
  migration?: { locked?: boolean }
  [key: string]: unknown
}

/** Only the simple field/key paths committed in this migration are supported. */
export function contentValue(row: unknown, path: string): unknown {
  let value = row
  const parts = path.split('.')
  for (const [index, part] of parts.entries()) {
    const match = /^(\w+)(?:\[_key=="([^"]+)"\])?$/.exec(part)
    if (!match) throw new Error(`Unsupported content path: ${path}`)
    value =
      value && typeof value === 'object' ? (value as Record<string, unknown>)[match[1]!] : undefined
    if (match[2]) {
      if (!Array.isArray(value)) throw new Error(`Missing array at ${path}`)
      const matches = value.filter((item) => item?._key === match[2])
      if (matches.length === 0 && index === parts.length - 1) return null
      if (matches.length !== 1) throw new Error(`Expected one keyed item at ${path}`)
      value = matches[0]
    }
  }
  return value ?? null
}

export function planFigmaContentAlignment(
  row: ContentRow,
  allowLocked = false,
  source: {
    documents: {
      id: string
      type: string
      slug: string | null
      patches: { path: string; before: unknown; after: unknown }[]
    }[]
  } = manifest,
) {
  const id = row._id.replace(/^drafts\./, '')
  const spec = source.documents.find((document) => document.id === id)
  if (!spec || row._type !== spec.type || (row.slug?.current ?? null) !== spec.slug)
    throw new Error(`Unexpected content document: ${row._id}`)
  const set: Record<string, unknown> = {}
  const unset: string[] = []
  for (const field of spec.patches) {
    const current = contentValue(row, field.path)
    if (isDeepStrictEqual(current, field.after)) continue
    if (!isDeepStrictEqual(current, field.before))
      throw new Error(`Editorial change since review: ${row._id} ${field.path}`)
    if (field.after === null) unset.push(field.path)
    else set[field.path] = field.after
  }
  if (!Object.keys(set).length && !unset.length) return null
  if (row.migration?.locked && !allowLocked)
    throw new Error(`Content locked: ${row._id}; use the approved scoped --allow-locked override`)
  return { id: row._id, revision: row._rev, set, unset }
}

export const contentDocumentIds = manifest.documents.map((document) => document.id)
