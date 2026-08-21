/**
 * What the committed corpus is: the three trees under `data/`, the documents
 * in them, and the id contract that says which of a dataset's documents this
 * pipeline owns.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { CONVERTED_DIR, SEED_DIR, TRANSLATED_DIR } from '../lib/paths'
import { bareId } from './state'

/** The committed corpus trees, in load order, each at its root under `data/`. */
const CORPUS_TREES = {
  converted: CONVERTED_DIR,
  seed: SEED_DIR,
  translated: TRANSLATED_DIR,
} as const

export type CorpusTree = keyof typeof CORPUS_TREES

/** A committed document, before anything has validated its shape. */
export type CorpusDoc = { _id: string; _type: string; [key: string]: unknown }

/** A committed document and where it came from. */
export type CorpusEntry<T = CorpusDoc> = {
  /** The tree — `converted`, `seed` or `translated`. */
  readonly tree: string
  /** The type directory holding the file. */
  readonly type: string
  /** The file's own name, `<slug>.json`. */
  readonly file: string
  readonly document: T
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function directoriesIn(root: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(root)
  } catch (error) {
    /* A tree with nothing in it is not committed — git does not track an empty
     * directory — so an absent root is a tree of no documents. Any other read
     * error is still an error. */
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
  return entries.sort().filter((entry) => {
    /* A dangling symlink or unreadable entry is not a type directory, and the
     * reader must not take the whole load down over one. */
    try {
      return statSync(join(root, entry)).isDirectory()
    } catch {
      return false
    }
  })
}

/**
 * Every type directory in the committed trees, whether or not it holds a
 * document yet — the boundary `corpus.test.ts` checks internal types against,
 * which a document-level read cannot see (a directory of nothing but markdown
 * yields no entries).
 */
export function corpusTypeDirs(): { tree: CorpusTree; type: string }[] {
  return Object.entries(CORPUS_TREES).flatMap(([tree, root]) =>
    directoriesIn(root).map((type) => ({ tree: tree as CorpusTree, type })),
  )
}

/**
 * One tree, rooted anywhere. Sorted by type then file, so the order documents
 * load in — and the order a finding names them — is the same on every machine.
 */
export function readTree<T = CorpusDoc>(tree: string, root: string): CorpusEntry<T>[] {
  return directoriesIn(root).flatMap((type) =>
    readdirSync(join(root, type))
      .sort()
      .filter((file) => file.endsWith('.json'))
      .map((file) => ({ tree, type, file, document: readJson<T>(join(root, type, file)) })),
  )
}

/**
 * The committed corpus. Named trees are read in the order `CORPUS_TREES`
 * declares them, whatever order they were asked for; with none named, all
 * three.
 */
export function readCorpus<T = CorpusDoc>(...trees: readonly CorpusTree[]): CorpusEntry<T>[] {
  const wanted = trees.length > 0 ? new Set<string>(trees) : null
  return Object.entries(CORPUS_TREES)
    .filter(([tree]) => !wanted || wanted.has(tree))
    .flatMap(([tree, root]) => readTree<T>(tree, root))
}

/** Where an entry came from, as the path a person would open. */
export function corpusPath(entry: Pick<CorpusEntry<unknown>, 'tree' | 'type' | 'file'>): string {
  return `${entry.tree}/${entry.type}/${entry.file}`
}

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
export function slugsByType(
  entries: readonly CorpusEntry[] = readCorpus(),
): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const { document } of entries) {
    const slug = (document.slug as { current?: string } | undefined)?.current
    if (!slug) continue
    ;(out[document._type] ??= []).push(slug)
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
 * Rebuild): `<type>-wp-<id>` for migrated documents, `<type>-seed-<slug>`
 * for greenfield ones. Everything else in the dataset — Studio-created
 * documents, uuid drafts, `siteSettings` — is outside the pipeline's
 * authority and is never retired by `load`.
 *
 * An internal type's documents are excluded by name, not by shape: a corpus
 * key is any kebab string, so `brief-wp-notes` is a legal brief id that the
 * bare pattern would otherwise claim.
 */
export function isPipelineOwned(id: string): boolean {
  const bare = bareId(id)
  if (INTERNAL_TYPES.some((type) => bare.startsWith(`${type}-`))) return false
  return /^[a-zA-Z]+-(wp|seed)-./.test(bare)
}

/**
 * A brief's deterministic id — `brief-<key>`, the id a `briefs` reference in
 * seed JSON points at. A matcher only: the id is constructed by `idFor` in
 * `tools/guidance/src/corpus/plan.ts`, which this tool does not import
 * because it is deleted post-migration and the corpus tool is not.
 */
export const BRIEF_ID = /^brief-[a-z0-9]+(-[a-z0-9]+)*$/
