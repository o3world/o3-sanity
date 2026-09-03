/**
 * Which committed documents a targeted run is about.
 *
 * Pure — the corpus and the patterns in, the selection out — so the rule that
 * decides what a `sync-docs` run touches is pinned by a fixture rather than by
 * a dataset with no backups. Same reasoning as `plan.ts`, for the same reason.
 */
import type { CorpusEntry } from './read'

/**
 * Which committed documents a pattern names.
 *
 * `<type>/<file>` against the corpus path with the `.json` and the tree
 * dropped, `*` matching within one segment — `client/*`, `page/partners-*`.
 * A pattern that matches nothing is an error rather than an empty run: a typo
 * that silently syncs zero documents reads exactly like a success.
 */
export function selectorFor(pattern: string): RegExp {
  const escaped = pattern
    .replace(/\.json$/, '')
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^/]*')
  return new RegExp(`^${escaped}$`)
}

/** `<type>/<file>` for an entry — what a pattern is written against. */
export function selectionKey(entry: Pick<CorpusEntry, 'type' | 'file'>): string {
  return `${entry.type}/${entry.file.replace(/\.json$/, '')}`
}

export function select(
  entries: readonly CorpusEntry[],
  patterns: readonly string[],
): { matched: CorpusEntry[]; empty: string[] } {
  const matched = new Map<string, CorpusEntry>()
  const empty: string[] = []
  for (const pattern of patterns) {
    const selector = selectorFor(pattern)
    const hits = entries.filter((entry) => selector.test(selectionKey(entry)))
    if (hits.length === 0) empty.push(pattern)
    for (const hit of hits) matched.set(hit.document._id, hit)
  }
  return { matched: [...matched.values()], empty }
}
