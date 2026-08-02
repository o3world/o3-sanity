/**
 * Overrides → the last step of `convert`.
 *
 * A migrated document is rebuilt from `data/extract/` on every run, so a field
 * somebody wants to replace cannot simply be edited in `data/converted/` — the
 * next `convert` overwrites it, silently and completely. It lives here
 * instead: `data/overrides/<type>/<id>.json`, committed, carrying its own
 * `_meta` provenance, merged onto the converted document as the last thing the
 * mapper's output goes through.
 *
 * The layer is shaped like `translated/` (input + a recorded decision → output
 * with `_meta` provenance) and keeps the same two disciplines:
 *
 * - **`_meta` is for the reviewer and never reaches the dataset.** It stays in
 *   the override file; only the overriding fields are merged.
 * - **An override that no longer applies FAILS the run.** Naming a document
 *   conversion no longer emits, or a field conversion no longer produces, is a
 *   stale decision — and a stale decision that skips silently is a field
 *   quietly reverting to whatever WordPress says.
 *
 * Overrides replace, they do not invent: a field an override sets has to
 * already exist on the converted document. Inventing a field is a mapper
 * change or a schema conversation, and this layer is neither.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import type { ConversionIssue } from './htmlToPortableText'
import { OVERRIDES_DIR, REPO_ROOT } from './paths'

/** Why this override exists, who decided it, and when. Never loaded. */
export interface OverrideMeta {
  /** The instruction, in the words it was given in. */
  readonly direction: string
  /** Who gave it. */
  readonly decidedBy: string
  /** `YYYY-MM-DD`. */
  readonly decidedAt: string
  /** Anything a reviewer needs that the direction does not say. */
  readonly note?: string
}

export interface Override {
  /** `perspective/perspective-wp-10635.json` — what the report names. */
  readonly source: string
  readonly type: string
  readonly id: string
  readonly meta: OverrideMeta
  /** The fields merged onto the converted document. */
  readonly fields: Readonly<Record<string, unknown>>
}

/**
 * Fields an override may never touch. `_id` and `_type` are the deterministic
 * id contract; `migration` is the converter's provenance record, and an
 * override that could rewrite it could claim a document came from somewhere it
 * did not.
 */
const RESERVED = new Set(['_id', '_type', 'migration'])

function fail(source: string, detail: string): never {
  throw new Error(`data/overrides/${source}: ${detail}`)
}

/**
 * Read the committed override tree. A malformed file throws rather than
 * reporting: it is not a decision about one document that a reviewer can weigh
 * in a report, it is a file that does not say what it means.
 */
export function readOverrides(): Override[] {
  if (!existsSync(OVERRIDES_DIR)) return []
  const out: Override[] = []
  for (const type of readdirSync(OVERRIDES_DIR)) {
    const dir = join(OVERRIDES_DIR, type)
    for (const name of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      const source = `${type}/${name}`
      const raw = JSON.parse(readFileSync(join(dir, name), 'utf8')) as Record<string, unknown>

      const id = raw._id
      if (typeof id !== 'string' || !id) fail(source, 'no _id — an override names its target')
      if (name !== `${id}.json`) fail(source, `_id "${id}" does not match the filename`)
      if (!id.startsWith(`${type}-`)) fail(source, `_id "${id}" is not a ${type} document`)

      const meta = raw._meta as Partial<OverrideMeta> | undefined
      if (!meta?.direction?.trim() || !meta.decidedBy?.trim()) {
        fail(source, 'no _meta.direction / _meta.decidedBy — an override records who decided it')
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.decidedAt ?? '')) {
        fail(source, 'no _meta.decidedAt (YYYY-MM-DD)')
      }

      const fields = Object.fromEntries(Object.entries(raw).filter(([k]) => k !== '_meta'))
      delete fields._id
      for (const key of Object.keys(fields)) {
        if (RESERVED.has(key) || key.startsWith('_')) {
          fail(source, `may not override "${key}"`)
        }
      }
      if (Object.keys(fields).length === 0) fail(source, 'overrides nothing')

      out.push({ source, type, id, meta: meta as OverrideMeta, fields })
    }
  }
  return out
}

/** Every `_localSrc` marker under a node. */
function localSrcIn(node: unknown, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) localSrcIn(item, found)
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (typeof obj._localSrc === 'string') found.push(obj._localSrc)
    for (const value of Object.values(obj)) localSrcIn(value, found)
  }
  return found
}

/**
 * Everything wrong with applying `override` to `doc`, as conversion issues —
 * empty when the override still applies cleanly.
 *
 * `_localSrc` is checked here rather than left to `load`, for the reason the
 * seed rules already give: a marker pointing at a file that is not in the repo
 * passes on the machine that authored it and fails from a fresh clone.
 */
export function overrideIssues(
  override: Override,
  doc: Readonly<Record<string, unknown>>,
): ConversionIssue[] {
  const issues: ConversionIssue[] = []
  for (const key of Object.keys(override.fields)) {
    if (!(key in doc)) {
      issues.push({
        element: `override ${override.source}`,
        detail: `replaces "${key}", which ${override.id} no longer has — the decision is stale`,
      })
    }
  }
  for (const path of localSrcIn(override.fields)) {
    if (!existsSync(join(REPO_ROOT, path))) {
      issues.push({
        element: `override ${override.source}`,
        detail: `_localSrc "${path}" is not a file in the repo`,
      })
    }
  }
  return issues
}

/**
 * The override tree, and the bookkeeping that makes a stale one loud: every
 * override has to find its document during the run, or `unapplied()` names it
 * and the run fails.
 */
export class OverrideLayer {
  private readonly byId: Map<string, Override>
  private readonly used = new Set<string>()

  constructor(overrides: readonly Override[] = readOverrides()) {
    this.byId = new Map()
    for (const override of overrides) {
      const clash = this.byId.get(override.id)
      if (clash) fail(override.source, `${clash.source} already overrides ${override.id}`)
      this.byId.set(override.id, override)
    }
  }

  /**
   * `doc` with its overrides merged, or the reasons they no longer apply.
   * Top-level replacement, not a deep merge: a half-replaced `featuredImage`
   * carrying both a `_wpSrc` and a `_localSrc` is not a thing anyone means.
   */
  apply(doc: Readonly<Record<string, unknown>>): {
    doc: Record<string, unknown>
    issues: ConversionIssue[]
    override?: Override
  } {
    const override = this.byId.get(doc._id as string)
    if (!override) return { doc: { ...doc }, issues: [] }
    this.used.add(override.id)
    const issues = overrideIssues(override, doc)
    if (issues.length > 0) return { doc: { ...doc }, issues, override }
    return { doc: { ...doc, ...override.fields }, issues, override }
  }

  /** Overrides whose document never converted — stale, and a run failure. */
  unapplied(): Override[] {
    return [...this.byId.values()].filter((o) => !this.used.has(o.id))
  }
}
