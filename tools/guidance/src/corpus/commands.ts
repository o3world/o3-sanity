/**
 * The two corpus commands, minus their client. `sync` returns the writes to
 * commit and `check` returns an exit code; both take the dataset as a snapshot
 * and report through an injected sink, so the whole of what an operator sees is
 * exercised by the unit suite rather than by running it against a project.
 */
import { driftOf, ownedFieldsOf, planCorpus } from './plan'

import type {
  Corpus,
  CorpusConflict,
  CorpusDocument,
  CorpusDrift,
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
 * Every source the corpus can commit is written, settled or not: the writes are
 * idempotent against a deterministic id, and writing the whole corpus is what
 * makes a re-run a repair rather than a diff to trust.
 *
 * A `replace` corpus goes out whole. A `merge` corpus creates the document and
 * then sets only the fields the source owns, because the dataset writes some of
 * them: replacing a brief would wipe the `record` the authoring skill left in
 * it (ADR 0027).
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
      writes.push({ op: 'patch', _id: document._id, set: ownedFieldsOf(corpus, document) })
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
