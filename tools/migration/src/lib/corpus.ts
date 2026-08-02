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
