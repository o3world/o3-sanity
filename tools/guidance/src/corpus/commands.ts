/**
 * The two corpus commands, minus their client. `sync` returns the writes to
 * commit and `check` returns an exit code; both take the dataset as a snapshot
 * and report through an injected sink, so the whole of what an operator sees is
 * exercised by the unit suite rather than by running it against a project.
 */
import { driftOf, ownedFieldsOf, planCorpus } from './plan'

import type { Corpus, CorpusDocument, CorpusSnapshotDocument } from './plan'

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
 * Every source is written, settled or not: the writes are idempotent against a
 * deterministic id, and writing the whole corpus is what makes a re-run a
 * repair rather than a diff to trust.
 *
 * A `replace` corpus goes out whole. A `merge` corpus creates the document and
 * then sets only the fields the source owns, because the dataset writes some of
 * them: replacing a brief would wipe the `record` the authoring skill left in
 * it (ADR 0027).
 *
 * Documents go out **published**. A draft of one can only be an accident — a
 * file-backed document is `readOnly` in Studio — but it would shadow the synced
 * copy for anything reading with the drafts perspective, so it goes too.
 */
export function syncCorpus(
  corpus: Corpus,
  snapshot: readonly CorpusSnapshotDocument[],
  out: CommandOutput,
): CorpusWrite[] {
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

  return writes
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

function describe(finding: ReturnType<typeof driftOf>[number]): string {
  switch (finding.kind) {
    case 'missing':
      return `${finding._id} is missing from the dataset`
    case 'drifted':
      return `${finding._id} drifted from ${finding.sourcePath}: ${finding.fields?.join(', ')}`
    case 'unsourced':
      return `${finding._id} has no source in the corpus`
  }
}
