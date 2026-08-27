/**
 * Drift: which pipeline-owned documents an editor changed in the dataset since
 * the corpus was committed — the documents the next `load` would silently
 * revert.
 *
 * Pure — expected documents, live documents and the committed asset map in,
 * findings out — so the comparison rules are pinned by fixtures.
 *
 * `resolveMarkers` is the pure twin of `resolveAssets` in `load.ts`: the same
 * marker vocabulary, the same figure-drop rule, minus the uploads. It exists
 * because a committed document carries `_wpSrc`/`_srcUrl`/`_localSrc` markers
 * where the dataset carries asset references, and comparing the two without
 * translating one side would flag every image as an edit. Change one twin,
 * change the other.
 */
import { bareId } from './state'

export type AnyDoc = { _id: string; _type: string; [k: string]: unknown }

/** `data/assets.json`, read for its ids only. */
export type AssetMap = Readonly<Record<string, { readonly assetId: string }>>

/** Sentinel for a node whose media the source site no longer serves. */
const DROPPED = Symbol('dropped')

const REMOTE_MARKERS = ['_wpSrc', '_srcUrl'] as const
const MARKERS = [...REMOTE_MARKERS, '_localSrc'] as const

/**
 * A committed document as `load` would write it: markers resolved to asset
 * references through the committed map, known-missing media dropped, a
 * dropped image taking its figure with it. A marker the map has no entry for
 * is left in place — `load` would upload it, so the document genuinely
 * differs from what the dataset holds.
 */
export function resolveMarkers(
  node: unknown,
  assets: AssetMap,
  missing: ReadonlySet<string>,
): unknown {
  const resolved = resolve(node, assets, missing)
  return resolved === DROPPED ? undefined : resolved
}

function resolve(
  node: unknown,
  assets: AssetMap,
  missing: ReadonlySet<string>,
): unknown | typeof DROPPED {
  if (Array.isArray(node)) {
    return node.map((item) => resolve(item, assets, missing)).filter((item) => item !== DROPPED)
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const marker = MARKERS.find((name) => typeof obj[name] === 'string')
    if (marker) {
      const source = obj[marker] as string
      const remote = marker !== '_localSrc'
      if (remote && missing.has(source)) return DROPPED
      const known = assets[remote ? source : `file:${source}`]
      if (!known) return node
      const rest = Object.fromEntries(Object.entries(obj).filter(([k]) => k !== marker))
      return { ...rest, asset: { _type: 'reference', _ref: known.assetId } }
    }
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      const value = resolve(v, assets, missing)
      if (value === DROPPED) {
        if (k === 'image') return DROPPED
        continue
      }
      out[k] = value
    }
    return out
  }
  return node
}

/** The bookkeeping Content Lake stamps on every write; never an edit. */
const SYSTEM_KEYS = new Set(['_rev', '_createdAt', '_updatedAt', '_originalId', '_system'])

export function stripSystem(doc: AnyDoc): AnyDoc {
  return Object.fromEntries(Object.entries(doc).filter(([k]) => !SYSTEM_KEYS.has(k))) as AnyDoc
}

/** Structural equality; an absent key and an `undefined` value are the same. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]))
  }
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false
    const objA = a as Record<string, unknown>
    const objB = b as Record<string, unknown>
    const keys = new Set([...Object.keys(objA), ...Object.keys(objB)])
    return [...keys].every((key) => deepEqual(objA[key], objB[key]))
  }
  return false
}

/** The top-level fields where two copies of one document disagree. */
export function diffFields(expected: AnyDoc, live: AnyDoc): string[] {
  const keys = new Set([...Object.keys(expected), ...Object.keys(live)])
  return [...keys].filter((key) => !SYSTEM_KEYS.has(key) && !deepEqual(expected[key], live[key]))
}

/** One document the next load would damage, and how. */
export interface DriftFinding {
  readonly id: string
  /** Top-level fields the published copy changed; empty when only a draft is at risk. */
  readonly fields: readonly string[]
  /** A live draft shadows this document — `load` deletes it unseen. */
  readonly draft: boolean
}

/**
 * Every unlocked document `load` would write, compared with what the dataset
 * holds. `expected` is the load plan's writes with markers resolved; `live`
 * is a raw fetch of those ids in both forms. A missing published copy is not
 * drift — it is a document nobody has loaded yet.
 */
export function driftBetween(
  expected: readonly AnyDoc[],
  live: readonly AnyDoc[],
  assets: AssetMap,
  missing: ReadonlySet<string>,
): DriftFinding[] {
  const published = new Map<string, AnyDoc>()
  const drafts = new Set<string>()
  for (const doc of live) {
    if (doc._id.startsWith('drafts.')) drafts.add(bareId(doc._id))
    else published.set(doc._id, doc)
  }

  const findings: DriftFinding[] = []
  for (const doc of expected) {
    const liveDoc = published.get(doc._id)
    const resolved = resolveMarkers(doc, assets, missing) as AnyDoc | undefined
    const fields =
      liveDoc && resolved ? diffFields(stripSystem(resolved), stripSystem(liveDoc)) : []
    const draft = drafts.has(doc._id)
    if (fields.length > 0 || draft) findings.push({ id: doc._id, fields, draft })
  }
  return findings
}
