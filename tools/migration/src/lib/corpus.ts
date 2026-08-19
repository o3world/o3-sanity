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
 * The document types this pipeline does not own. `brief` is synced from repo
 * markdown by `tools/guidance`
 * ([ADR 0027](../../../../docs/adr/0027-the-brief-is-a-document.md)) and
 * outlives this pipeline, which is deleted post-migration. So a brief is never
 * committed under `data/`, `load` never writes or retires one, and `verify`
 * does not count one an orphan.
 *
 * `guidance` is a retired type with no schema and no writer (#192), named here
 * because the `production` dataset still holds six of its documents: without
 * the name, `verify` reports them as orphans and exits non-zero over documents
 * nothing is going to rewrite.
 */
const INTERNAL_TYPES: readonly string[] = ['guidance', 'brief']

export function isInternalType(type: string): boolean {
  return INTERNAL_TYPES.includes(type)
}

/**
 * Pipeline ownership is the deterministic id contract (CONTEXT.md →
 * Rebuild): `<type>-wp-<id>` for a WordPress document, `<type>-framer-<key>`
 * for one migrated from o3xo.ai, `<type>-seed-<slug>` for a greenfield one.
 * Everything else in the dataset — Studio-created documents, uuid drafts,
 * `siteSettings` — is outside the pipeline's authority and is never retired
 * by `load`.
 *
 * The source token is what makes the delete half of the rebuild promise true:
 * a document whose id this does not match is written on every load and removed
 * by none, so a renamed slug leaves the old document serving its old URL
 * forever.
 *
 * An internal type's documents are excluded by name, not by shape: a corpus
 * key is any kebab string, so `brief-wp-notes` is a legal brief id that the
 * bare pattern would otherwise claim.
 */
export function isPipelineOwned(id: string): boolean {
  const bare = id.replace(/^drafts\./, '')
  if (INTERNAL_TYPES.some((type) => bare.startsWith(`${type}-`))) return false
  return /^[a-zA-Z]+-(wp|framer|seed)-./.test(bare)
}

/**
 * A brief's deterministic id — `brief-<key>`, the id a `briefs` reference in
 * seed JSON points at. A matcher only: the id is constructed by `idFor` in
 * `tools/guidance/src/corpus/plan.ts`, which this tool does not import
 * because it is deleted post-migration and the corpus tool is not.
 */
export const BRIEF_ID = /^brief-[a-z0-9]+(-[a-z0-9]+)*$/
