import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { CONVERTED_DIR, SEED_DIR, TRANSLATED_DIR } from './paths'

/** The three committed corpus trees, in load order. */
export const CORPUS_DIRS = [CONVERTED_DIR, SEED_DIR, TRANSLATED_DIR] as const

/** Every `{_ref}` anywhere in a document, however deeply nested. */
export function refsIn(node: unknown, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) refsIn(item, found)
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (typeof obj._ref === 'string') found.push(obj._ref)
    for (const value of Object.values(obj)) refsIn(value, found)
  }
  return found
}

/**
 * Every slug in the committed corpus, keyed by `_type` — the input `sitePaths`
 * turns into the set of URLs the new site serves.
 */
export function slugsByType(): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const root of CORPUS_DIRS) {
    if (!existsSync(root)) continue
    for (const type of readdirSync(root)) {
      for (const file of readdirSync(join(root, type)).filter((f) => f.endsWith('.json'))) {
        const doc = JSON.parse(readFileSync(join(root, type, file), 'utf8')) as {
          _type: string
          slug?: { current?: string }
        }
        const slug = doc.slug?.current
        if (!slug) continue
        ;(out[doc._type] ??= []).push(slug)
      }
    }
  }
  return out
}

/**
 * Pipeline ownership is the deterministic id contract (CONTEXT.md →
 * Rebuild): `<type>-wp-<id>` for migrated documents, `<type>-seed-<slug>`
 * for greenfield ones. Everything else in the dataset — Studio-created
 * documents, uuid drafts, `siteSettings` — is outside the pipeline's
 * authority and is never retired by `load`.
 */
export function isPipelineOwned(id: string): boolean {
  return /^[a-zA-Z]+-(wp|seed)-./.test(id.replace(/^drafts\./, ''))
}

/**
 * The document types a different tool owns — `guidance` (#72,
 * [ADR 0024](../../../../docs/adr/0024-authoring-knowledge-has-one-source-and-one-fan-out.md))
 * and `brief` ([ADR 0027](../../../../docs/adr/0027-the-brief-is-a-document.md)).
 *
 * Both are synced from repo markdown by `tools/guidance`, and both outlive
 * this pipeline, which is deleted post-migration. So they are never committed
 * under `data/`, `load` never writes or retires one (their ids miss
 * `isPipelineOwned` deliberately), and `verify` does not count one an orphan.
 */
const INTERNAL_TYPES: readonly string[] = ['guidance', 'brief']

export function isInternalType(type: string): boolean {
  return INTERNAL_TYPES.includes(type)
}

/**
 * A brief's deterministic id — `brief-<key>`, the id a `briefs` reference in
 * seed JSON points at. One declaration so the corpus check and the sync tool
 * cannot disagree about the shape.
 */
export const BRIEF_ID = /^brief-[a-z0-9]+(-[a-z0-9]+)*$/
