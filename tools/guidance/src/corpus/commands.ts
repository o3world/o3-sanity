/**
 * The corpus commands, minus their client. `sync` returns the writes to commit,
 * `check` an exit code, `export` a file and the writes that back it; all three
 * take the dataset as a snapshot and report through an injected sink, so the
 * whole of what an operator sees is exercised by the unit suite rather than by
 * running it against a project.
 */
import { driftOf, fieldsOf, idFor, ownedFieldsOf, planCorpus } from './plan'
import { CORPUS_KEY, renderGlobbedSource } from './read'

import type {
  Corpus,
  CorpusConflict,
  CorpusDocument,
  CorpusDrift,
  CorpusPlan,
  CorpusSnapshotDocument,
} from './plan'

/** One transaction step. The caller turns these into client calls and nothing else. */
export type CorpusWrite =
  | { op: 'createOrReplace'; document: CorpusDocument }
  | { op: 'createIfNotExists'; document: CorpusDocument }
  | { op: 'patch'; _id: string; set: Record<string, unknown> }
  | { op: 'delete'; _id: string }

/** Where a command reports. `console` satisfies it; a test captures the lines. */
export type CommandOutput = {
  log: (line: string) => void
  error: (line: string) => void
}

/**
 * What a sync produces: the writes to commit, and an exit code, because a sync
 * can end with work it refused to do. The refused sources are already reported;
 * the caller's job is to commit the rest and carry the code out.
 */
export type CorpusSync = {
  writes: CorpusWrite[]
  status: number
}

/**
 * Every source the corpus can commit is written: the writes are idempotent
 * against a deterministic id, and writing the whole corpus is what makes a
 * re-run a repair rather than a diff to trust.
 *
 * A `replace` corpus goes out whole. A `merge` corpus creates the document and
 * then sets only the fields the source owns, because the dataset writes some of
 * them: replacing a brief would wipe the `record` the authoring skill left in
 * it (ADR 0027). A settled merge entry sets nothing at all — the create is free
 * against a document that exists, the patch would bump `_rev` on every run.
 *
 * A source the plan calls a conflict is skipped whole, writes and draft delete
 * alike, and reported as an error.
 *
 * Documents go out **published**. A draft of one can only be an accident — a
 * file-backed document is `readOnly` in Studio — but it would shadow the synced
 * copy for anything reading with the drafts perspective, so it goes too.
 */
export function syncCorpus(
  corpus: Corpus,
  snapshot: readonly CorpusSnapshotDocument[],
  out: CommandOutput,
): CorpusSync {
  const plan = planCorpus(corpus, snapshot)
  const writes: CorpusWrite[] = []

  for (const { document, state } of plan.entries) {
    out.log(`  ${state.padEnd(9)} ${document._id}  ← ${document.sourcePath ?? 'the dataset'}`)
    if (corpus.writes === 'replace') {
      writes.push({ op: 'createOrReplace', document })
    } else {
      writes.push({ op: 'createIfNotExists', document })
      if (state !== 'unchanged') {
        writes.push({ op: 'patch', _id: document._id, set: ownedFieldsOf(corpus, document) })
      }
    }
  }

  for (const orphan of plan.orphans) {
    out.log(`  retired   ${orphan._id}  ← no longer in the corpus`)
    writes.push({ op: 'delete', _id: orphan._id })
    writes.push({ op: 'delete', _id: `drafts.${orphan._id}` })
  }

  for (const disowned of plan.disowned) {
    out.log(`  left      ${disowned._id}  ← born in the dataset, not the repo's to touch`)
  }

  for (const { document } of plan.entries) {
    writes.push({ op: 'delete', _id: `drafts.${document._id}` })
  }

  if (plan.conflicts.length > 0) {
    out.error(`\n✗ ${plan.conflicts.length} source(s) not written — the dataset owns the id:`)
    for (const conflict of plan.conflicts) out.error(`    ${describeConflict(conflict)}`)
  }

  return { writes, status: plan.conflicts.length > 0 ? 1 : 0 }
}

/** What an export was asked to do, and what the corpus directory already holds. */
export type CorpusExportRequest = {
  /** The document to export. Absent lists the candidates instead of exporting one. */
  key?: string
  /** The globbed corpus directory the file lands in, repo-relative. */
  directory: string
  /** Repo-relative paths already in that directory — an export never clobbers one. */
  occupied: readonly string[]
}

/** What an export produced: the file to write, the writes that back it, an exit code. */
export type CorpusExport = {
  file?: { sourcePath: string; contents: string }
  writes: CorpusWrite[]
  status: number
}

/**
 * Export → a dataset-born document becomes a markdown file in the corpus, so it
 * survives a rebuild (ADR 0027).
 *
 * The candidates are exactly `plan.disowned`: documents the corpus refuses to
 * write and refuses to retire, because a session wrote them rather than the
 * repo. Naming none lists them — exporting every one blindly would file
 * everything an authoring session ever scribbled.
 */
export function exportCorpus(
  corpus: Corpus,
  snapshot: readonly CorpusSnapshotDocument[],
  request: CorpusExportRequest,
  out: CommandOutput,
): CorpusExport {
  const plan = planCorpus(corpus, snapshot)
  const candidates = plan.disowned

  if (request.key === undefined) {
    if (candidates.length === 0) {
      out.log(`no dataset-born ${corpus.type} document to export`)
      return { writes: [], status: 0 }
    }

    /* Split, because the operator exports by key and a listed key that no
     * lookup can honour is a promise: a document created in Studio carries a
     * UUID id and no key at all, the field being `readOnly` there. */
    const listed = candidates.map((document) => ({
      document,
      malformed: malformedKey(corpus.type, document),
    }))
    const exportable = listed.filter((row) => !row.malformed)
    const broken = listed.filter((row) => row.malformed)

    if (exportable.length > 0) {
      out.log(`${exportable.length} dataset-born ${corpus.type} document(s) to export:`)
      for (const { document } of exportable) {
        out.log(`  ${document.key}  ${document.title ?? ''}`.trimEnd())
      }
    }
    if (broken.length > 0) {
      out.log(`\n${broken.length} no key can name — repair the document, then export:`)
      for (const { document, malformed } of broken) out.log(`  ${document._id}  ${malformed}`)
    }
    return { writes: [], status: 0 }
  }

  /* Before anything is built from it: the key becomes a filename under the
   * corpus directory, and one carrying a separator would land outside it. */
  if (!CORPUS_KEY.test(request.key)) {
    out.error(`✗ "${request.key}" ${NOT_KEBAB}`)
    return { writes: [], status: 1 }
  }

  const _id = idFor(corpus.type, request.key)
  const candidate = candidates.find((document) => document._id === _id)
  if (!candidate) {
    out.error(`✗ ${describeUnexportable(corpus, plan, snapshot, _id)}`)
    return { writes: [], status: 1 }
  }

  /* From here `request.key` is the document's key as well as its id's, so the
   * file, the frontmatter and the stamp all spell the same one. */
  const malformed = malformedKey(corpus.type, candidate)
  if (malformed) {
    out.error(
      `✗ ${_id} is malformed — ${malformed}; patch \`key\` or \`_id\` by hand until the two spell one key, then export`,
    )
    return { writes: [], status: 1 }
  }

  /* The row carries the published copy, so a draft edited since holds material
   * the file would not: export would write the older body, and the draft delete
   * the next sync makes would take the newer one — `record` included. */
  if (candidate.draftBeside) {
    out.error(
      `✗ ${_id} has an unpublished draft beside it — publish or discard it in Studio, then export`,
    )
    return { writes: [], status: 1 }
  }

  const sourcePath = `${request.directory}/${request.key}.md`
  if (request.occupied.includes(sourcePath)) {
    out.error(`✗ ${sourcePath} already exists — export never writes over a file in the corpus`)
    return { writes: [], status: 1 }
  }

  /* The body as the corpus will read it back: the reader trims, so writing an
   * untrimmed one would leave the document one sync behind its own file. */
  const body = String(candidate[corpus.bodyField] ?? '').trim()
  const title = candidate.title == null ? '' : String(candidate.title)
  if (!body || !title) {
    out.error(`✗ ${_id} has no ${body ? 'title' : corpus.bodyField} to export`)
    return { writes: [], status: 1 }
  }

  const document: CorpusDocument = {
    _id,
    _type: corpus.type,
    key: request.key,
    title,
    [corpus.bodyField]: body,
    sourcePath,
  }

  out.log(`  exported  ${_id}  → ${sourcePath}`)
  const kept = fieldsKeptOnDocument(corpus, candidate)
  if (kept.length > 0) {
    out.log(
      `  the file carries ${corpus.bodyField} alone — ${kept.join(', ')} stay on the document`,
    )
  }

  /* The stamp lands on the published copy: that is the copy sync compares and a
   * reference resolves to. It carries the owned fields with it, so the document
   * matches its new file exactly and the next sync has nothing to write.
   *
   * A draft-only candidate is published whole first. Stamping the draft instead
   * would leave sync to build the published copy from the file, and the file
   * carries only the body — so the `record` an interview produced would go with
   * the draft that sync then deletes. */
  const writes: CorpusWrite[] = candidate.draftOnly
    ? [
        { op: 'createOrReplace', document: { ...heldFields(candidate), ...document } },
        { op: 'delete', _id: `drafts.${_id}` },
      ]
    : [{ op: 'patch', _id, set: ownedFieldsOf(corpus, document) }]

  return {
    file: { sourcePath, contents: renderGlobbedSource({ key: document.key, title, body }) },
    writes,
    status: 0,
  }
}

/** The grammar refusal, in one wording, because two would read as two rules. */
const NOT_KEBAB = `is not lowercase kebab-case (${CORPUS_KEY.source})`

/**
 * Why a document cannot be exported under the key its id spells, or
 * `undefined` when it can be.
 *
 * A key is written three times by an export — the filename, the frontmatter,
 * and the stamp on the document — and only the id is what the operator names.
 * A document whose `key` disagrees with its `_id` (an API writer can leave one
 * that way) would file itself under one key and stamp the other, and the next
 * sync would create the file's document without the `record` and retire the
 * one the stamp orphaned.
 */
function malformedKey(type: string, candidate: CorpusSnapshotDocument): string | undefined {
  const key = candidate.key
  if (typeof key !== 'string' || key === '') return 'no key'
  if (!CORPUS_KEY.test(key)) return `key "${key}" ${NOT_KEBAB}`
  if (candidate._id !== idFor(type, key)) return `key "${key}" is not the key its id spells`
  return undefined
}

/**
 * What the document holds that its file will not: everything outside the fields
 * a source owns. A merge sync writes around them, so export names them rather
 * than pretending the markdown is the whole brief.
 */
function fieldsKeptOnDocument(corpus: Corpus, candidate: CorpusSnapshotDocument): string[] {
  const owned = fieldsOf(corpus) as readonly string[]
  return Object.entries(candidate)
    .filter(([field]) => !RESERVED.has(field) && !owned.includes(field))
    .filter(([, value]) => (Array.isArray(value) ? value.length > 0 : Boolean(value)))
    .map(([field]) => field)
    .sort()
}

/**
 * Why a named key is not a candidate. Three ways: the repo already backs the
 * document, a file already registers the key over a dataset-born document — the
 * collision sync and check send here — or the dataset has no such document.
 */
function describeUnexportable(
  corpus: Corpus,
  plan: CorpusPlan,
  snapshot: readonly CorpusSnapshotDocument[],
  _id: string,
): string {
  const contested = plan.conflicts.find((conflict) => conflict._id === _id)
  if (contested) {
    return `${_id} was born in the dataset, but ${contested.sourcePath} already registers that key — give that file a different key, then export`
  }

  const live = snapshot.find((document) => document._id === _id)
  return live
    ? `${_id} is already file-backed (${live.sourcePath}) — the repo file is the source of truth`
    : `the dataset holds no dataset-born ${corpus.type} with that key (${_id})`
}

/**
 * Sanity's own fields and the snapshot's bookkeeping. Neither belongs in a
 * mutation body: `_id` and `_type` are set from the corpus, and the rest are the
 * dataset's to write.
 */
const RESERVED = new Set([
  '_id',
  '_type',
  '_rev',
  '_createdAt',
  '_updatedAt',
  'draftOnly',
  'draftBeside',
])

/** Everything a snapshot row holds that a mutation body may carry back. */
function heldFields(candidate: CorpusSnapshotDocument): Record<string, unknown> {
  return Object.fromEntries(Object.entries(candidate).filter(([field]) => !RESERVED.has(field)))
}

/**
 * The drift check, as an exit code: non-zero on any disagreement, so it works as
 * a checkpoint rather than a report nobody reads. The failure it exists to catch
 * is silent — a stale document does not error, it just makes everything an agent
 * writes that session quietly wrong.
 */
export function checkCorpus(
  corpus: Corpus,
  snapshot: readonly CorpusSnapshotDocument[],
  out: CommandOutput,
): number {
  const plan = planCorpus(corpus, snapshot)

  for (const { document, state } of plan.entries) {
    if (state === 'unchanged')
      out.log(`  ✓ ${document._id}  ${document.sourcePath ?? ''}`.trimEnd())
  }

  const drift = driftOf(plan)
  if (drift.length === 0) {
    out.log(`\n${corpus.type} matches the repo`)
    return 0
  }

  out.error(`\n✗ ${corpus.type} has drifted (${drift.length}) — run \`pnpm ${corpus.type}:sync\`:`)
  for (const finding of drift) out.error(`    ${describe(finding)}`)
  return 1
}

function describe(finding: CorpusDrift): string {
  switch (finding.kind) {
    case 'missing':
      return `${finding._id} is missing from the dataset`
    case 'drifted':
      return `${finding._id} drifted from ${finding.sourcePath}: ${finding.fields?.join(', ')}`
    case 'unsourced':
      return `${finding._id} has no source in the corpus`
    case 'conflicted':
      return describeConflict({
        _id: finding._id,
        sourcePath: finding.sourcePath,
        live: finding.live ?? 'published',
      })
  }
}

/**
 * The one finding a re-run cannot settle, so it says what to do instead: the
 * dataset copy becomes markdown, or the file takes a key nothing else holds.
 */
function describeConflict({ _id, sourcePath, live }: CorpusConflict): string {
  const held = live === 'draft' ? 'an unpublished draft' : 'a document'
  return `${_id} is ${held} born in the dataset, so ${sourcePath ?? 'the source'} cannot take that id — export the dataset copy, or give the file a different key`
}
