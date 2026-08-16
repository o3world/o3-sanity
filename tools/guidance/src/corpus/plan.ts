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

/** A corpus is its document type plus the sources currently registered for it. */
export type Corpus = {
  type: string
  sources: readonly CorpusSource[]
}

/** The document the corpus writes: the source, addressed by a deterministic id. */
export type CorpusDocument = {
  _id: string
  _type: string
  key: string
  title: string
  body: string
  sourcePath?: string
}

/** Published documents of the corpus type, as the dataset currently holds them. */
export type CorpusSnapshotDocument = {
  _id: string
  key?: string
  title?: string
  body?: string
  sourcePath?: string
}

/** The fields a source owns — everything the dataset copy is compared on. */
export const CORPUS_FIELDS = ['key', 'title', 'body', 'sourcePath'] as const

type CorpusField = (typeof CORPUS_FIELDS)[number]

type CorpusEntry = {
  document: CorpusDocument
  state: 'created' | 'updated' | 'unchanged'
  /** Which fields the dataset copy disagrees on. Empty unless `updated`. */
  fields: CorpusField[]
}

export type CorpusPlan = {
  entries: CorpusEntry[]
  /** Snapshot documents no source claims. What to do with one is the command's call. */
  orphans: CorpusSnapshotDocument[]
}

/** One verdict in the drift report: a document the dataset disagrees with the repo about. */
export type CorpusDrift = {
  kind: 'missing' | 'drifted' | 'unsourced'
  _id: string
  sourcePath?: string
  /** Which fields disagree. Present only on `drifted`. */
  fields?: CorpusField[]
}

/**
 * Deterministic and outside the load pipeline's `<type>-(wp|seed)-` ownership
 * contract, so `load` never retires a corpus document.
 */
export const idFor = (type: string, key: string) => `${type}-${key}`

function documentFor(type: string, source: CorpusSource): CorpusDocument {
  return {
    _id: idFor(type, source.key),
    _type: type,
    key: source.key,
    title: source.title,
    body: source.body,
    ...(source.sourcePath === undefined ? {} : { sourcePath: source.sourcePath }),
  }
}

export function planCorpus(
  corpus: Corpus,
  snapshot: readonly CorpusSnapshotDocument[],
): CorpusPlan {
  const byId = new Map(snapshot.map((document) => [document._id, document]))

  const entries = corpus.sources.map((source): CorpusEntry => {
    const document = documentFor(corpus.type, source)
    const live = byId.get(document._id)
    if (!live) return { document, state: 'created', fields: [] }

    const fields = CORPUS_FIELDS.filter((field) => live[field] !== document[field])
    return { document, state: fields.length > 0 ? 'updated' : 'unchanged', fields }
  })

  const claimed = new Set(entries.map((entry) => entry.document._id))
  const orphans = snapshot.filter((document) => !claimed.has(document._id))

  return { entries, orphans: [...orphans] }
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
