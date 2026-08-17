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
 * sets only the fields the source owns, so a field the dataset writes — a
 * brief's `stage`, `thesis`, `draft` and the rest of what an authoring run
 * patches — survives a sync instead of being wiped by it (ADR 0027).
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

/**
 * One document of the corpus type, as the dataset currently holds it.
 *
 * A GROQ projection returns a field the document does not have as `null`, so
 * every optional field here is nullable and absence has two spellings.
 */
export type CorpusSnapshotDocument = {
  _id: string
  key?: string | null
  title?: string | null
  sourcePath?: string | null
  /**
   * The dataset holds this id only as a draft. Set by `normalizeSnapshot`; a
   * fetch that excludes drafts never produces one.
   */
  draftOnly?: boolean
  /**
   * A draft stands beside the published copy this row carries. Set by
   * `normalizeSnapshot`; the fields are the published ones either way.
   */
  draftBeside?: boolean
  [field: string]: unknown
}

const DRAFT_PREFIX = 'drafts.'
const VERSION_PREFIX = 'versions.'

/**
 * A fetch that includes drafts → one row per id.
 *
 * A draft and its published copy are two rows of one document, and the corpus
 * plans against documents: the published copy's fields are what a sync
 * compares, and `sourcePath` counts from either copy, because provenance
 * belongs to the document rather than to the copy that happens to carry it.
 *
 * Drafts have to reach the plan at all because the document a key collision
 * would destroy is usually one the authoring skill never published (ADR 0027).
 *
 * A release version — the third copy a `raw` fetch returns — is dropped: it is
 * a proposed future document, and the corpus plans against the one in the
 * dataset now.
 */
export function normalizeSnapshot(
  rows: readonly CorpusSnapshotDocument[],
): CorpusSnapshotDocument[] {
  const published = new Map<string, CorpusSnapshotDocument>()
  const drafts = new Map<string, CorpusSnapshotDocument>()
  for (const row of rows) {
    if (row._id.startsWith(VERSION_PREFIX)) continue
    if (row._id.startsWith(DRAFT_PREFIX)) drafts.set(row._id.slice(DRAFT_PREFIX.length), row)
    else published.set(row._id, row)
  }

  const draftOnlyIds = [...drafts.keys()].filter((id) => !published.has(id))
  return [...published.keys(), ...draftOnlyIds].map((_id) => {
    const live = published.get(_id)
    const draft = drafts.get(_id)
    if (!live) return { ...draft, _id, draftOnly: true }

    /* The fold keeps the published fields, so a draft edited since is an edit
     * the row cannot show. Sync deletes such a draft — right on a file-backed
     * document, whose draft can only be an accident — so the row says the
     * draft is there and export refuses to promote the copy under it. */
    const beside = draft ? { draftBeside: true } : {}
    if (live.sourcePath == null && draft?.sourcePath != null) {
      return { ...live, ...beside, sourcePath: draft.sourcePath }
    }
    return { ...live, ...beside }
  })
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

/**
 * A source whose id is already held by a document the corpus does not own.
 * Nothing is planned for it: writing would patch the repo's copy over work the
 * dataset owns and convert it to file-backed on the way (ADR 0027).
 */
export type CorpusConflict = {
  _id: string
  /** The markdown that asks for the id. */
  sourcePath?: string
  /** How the dataset holds the id — as a published document, or as a draft. */
  live: 'published' | 'draft'
}

export type CorpusPlan = {
  entries: CorpusEntry[]
  /** Sources the corpus cannot commit, because the dataset owns the id already. */
  conflicts: CorpusConflict[]
  /** Snapshot documents no source claims. What to do with one is the command's call. */
  orphans: CorpusSnapshotDocument[]
  /** Snapshot documents outside the corpus's authority — never written, never reported. */
  disowned: CorpusSnapshotDocument[]
}

/** One verdict in the drift report: a document the dataset disagrees with the repo about. */
export type CorpusDrift = {
  kind: 'missing' | 'drifted' | 'unsourced' | 'conflicted'
  _id: string
  sourcePath?: string
  /** Which fields disagree. Present only on `drifted`. */
  fields?: string[]
  /** How the dataset holds a contested id. Present only on `conflicted`. */
  live?: CorpusConflict['live']
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
  const ours = (document: CorpusSnapshotDocument) =>
    corpus.claimsOrphans === 'every' || document.sourcePath != null

  const entries: CorpusEntry[] = []
  const conflicts: CorpusConflict[] = []

  for (const source of corpus.sources) {
    const document = documentFor(corpus, source)
    const live = byId.get(document._id)

    /* The id is derived from the key, so a new source can land on one the
     * dataset already owns. Writing it would be a silent conversion. */
    if (live && !ours(live)) {
      conflicts.push({
        _id: document._id,
        sourcePath: document.sourcePath,
        live: live.draftOnly ? 'draft' : 'published',
      })
      continue
    }

    /* A draft-only id has no published copy to compare, so the document the
     * corpus writes is missing however complete the draft is. */
    if (!live || live.draftOnly) {
      entries.push({ document, state: 'created', fields: [] })
      continue
    }

    const stale = fields.filter((field) => live[field] !== document[field])
    entries.push({ document, state: stale.length > 0 ? 'updated' : 'unchanged', fields: stale })
  }

  const claimed = new Set([
    ...entries.map((entry) => entry.document._id),
    ...conflicts.map((conflict) => conflict._id),
  ])
  const unclaimed = snapshot.filter((document) => !claimed.has(document._id))

  return {
    entries,
    conflicts,
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
  const contested = plan.conflicts.map(({ _id, sourcePath, live }): CorpusDrift => ({
    kind: 'conflicted',
    _id,
    sourcePath,
    live,
  }))

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
    sourcePath: document.sourcePath ?? undefined,
  }))

  return [...contested, ...stale, ...unsourced]
}
