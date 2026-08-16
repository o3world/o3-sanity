/**
 * The corpus plan: repo sources + a dataset snapshot → what to write and what
 * has drifted.
 *
 * Pure. No Sanity client, no filesystem — the commands hand it what they read
 * and act on what it returns, which is what makes a corpus testable without a
 * project, a token, or a network.
 */

/** One registered source: the markdown behind a document, however it was registered. */
export type CorpusSource = {
  key: string
  title: string
  body: string
  /** Repo-relative provenance. Absent on a document born in the dataset. */
  sourcePath?: string
}

/**
 * How a source commits. `replace` writes the whole document, which is right
 * when the repo owns every field of it. `merge` creates the document and then
 * sets only the fields the source owns, so a field the dataset writes —
 * `brief.record`, where the authoring skill persists its interview — survives
 * a sync instead of being wiped by it (ADR 0027).
 */
export type WriteMode = 'replace' | 'merge'

/**
 * What a dataset document no source backs means to the corpus. `every` — the
 * repo is the whole truth, so it is a leftover to retire. `file-backed` — a
 * document with no `sourcePath` was written in the dataset on purpose and is
 * outside the corpus's authority entirely (ADR 0027's dataset-born brief).
 */
export type OrphanClaim = 'every' | 'file-backed'

/** A corpus is its document type, how it writes, and the sources registered for it. */
export type Corpus = {
  type: string
  /** The document field one source's markdown lands in — `brief` has no `body`. */
  bodyField: string
  writes: WriteMode
  claimsOrphans: OrphanClaim
  sources: readonly CorpusSource[]
}

/** The document the corpus writes: the source, addressed by a deterministic id. */
export type CorpusDocument = {
  _id: string
  _type: string
  key: string
  title: string
  sourcePath?: string
  /** The markdown body, under whichever field the corpus maps it to. */
  [field: string]: unknown
}

/** Published documents of the corpus type, as the dataset currently holds them. */
export type CorpusSnapshotDocument = {
  _id: string
  key?: string
  title?: string
  sourcePath?: string
  [field: string]: unknown
}

/**
 * The fields a source owns: everything the dataset copy is compared on, what a
 * merge write sets, and what the snapshot query projects — one list, so
 * comparison and fetch cannot drift apart. Generic in the body field so a
 * corpus can still pin the whole list against its generated document type.
 */
export function fieldsOf<Body extends string>(corpus: { bodyField: Body }) {
  return ['key', 'title', corpus.bodyField, 'sourcePath'] as const
}

type CorpusEntry = {
  document: CorpusDocument
  state: 'created' | 'updated' | 'unchanged'
  /** Which fields the dataset copy disagrees on. Empty unless `updated`. */
  fields: string[]
}

export type CorpusPlan = {
  entries: CorpusEntry[]
  /** Snapshot documents no source claims. What to do with one is the command's call. */
  orphans: CorpusSnapshotDocument[]
  /** Snapshot documents outside the corpus's authority — never written, never reported. */
  disowned: CorpusSnapshotDocument[]
}

/** One verdict in the drift report: a document the dataset disagrees with the repo about. */
export type CorpusDrift = {
  kind: 'missing' | 'drifted' | 'unsourced'
  _id: string
  sourcePath?: string
  /** Which fields disagree. Present only on `drifted`. */
  fields?: string[]
}

/**
 * Deterministic and outside the load pipeline's `<type>-(wp|seed)-` ownership
 * contract, so `load` never retires a corpus document.
 */
export const idFor = (type: string, key: string) => `${type}-${key}`

function documentFor(corpus: Corpus, source: CorpusSource): CorpusDocument {
  return {
    _id: idFor(corpus.type, source.key),
    _type: corpus.type,
    key: source.key,
    title: source.title,
    [corpus.bodyField]: source.body,
    ...(source.sourcePath === undefined ? {} : { sourcePath: source.sourcePath }),
  }
}

/** Just the fields a source owns — what a `merge` write sets and nothing more. */
export function ownedFieldsOf(corpus: Corpus, document: CorpusDocument): Record<string, unknown> {
  return Object.fromEntries(
    fieldsOf(corpus)
      .filter((field) => document[field] !== undefined)
      .map((field) => [field, document[field]]),
  )
}

export function planCorpus(
  corpus: Corpus,
  snapshot: readonly CorpusSnapshotDocument[],
): CorpusPlan {
  const byId = new Map(snapshot.map((document) => [document._id, document]))
  const fields = fieldsOf(corpus)

  const entries = corpus.sources.map((source): CorpusEntry => {
    const document = documentFor(corpus, source)
    const live = byId.get(document._id)
    if (!live) return { document, state: 'created', fields: [] }

    const stale = fields.filter((field) => live[field] !== document[field])
    return { document, state: stale.length > 0 ? 'updated' : 'unchanged', fields: stale }
  })

  const claimed = new Set(entries.map((entry) => entry.document._id))
  const unclaimed = snapshot.filter((document) => !claimed.has(document._id))
  const ours = (document: CorpusSnapshotDocument) =>
    corpus.claimsOrphans === 'every' || document.sourcePath !== undefined

  return {
    entries,
    orphans: unclaimed.filter(ours),
    disowned: unclaimed.filter((document) => !ours(document)),
  }
}

/**
 * The drift report: everything in a plan that is not already settled. An empty
 * report is the dataset agreeing with the repo, which is the whole of what
 * `check` asks.
 */
export function driftOf(plan: CorpusPlan): CorpusDrift[] {
  const stale = plan.entries.flatMap(({ document, state, fields }): CorpusDrift[] => {
    if (state === 'created') {
      return [{ kind: 'missing', _id: document._id, sourcePath: document.sourcePath }]
    }
    if (state === 'updated') {
      return [{ kind: 'drifted', _id: document._id, sourcePath: document.sourcePath, fields }]
    }
    return []
  })

  const unsourced = plan.orphans.map((document): CorpusDrift => ({
    kind: 'unsourced',
    _id: document._id,
    sourcePath: document.sourcePath,
  }))

  return [...stale, ...unsourced]
}
