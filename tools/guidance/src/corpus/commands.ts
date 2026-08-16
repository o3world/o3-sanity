/**
 * The two corpus commands, minus their client. `sync` returns the writes to
 * commit and `check` returns an exit code; both take the dataset as a snapshot
 * and report through an injected sink, so the whole of what an operator sees is
 * exercised by the unit suite rather than by running it against a project.
 */
import { driftOf, planCorpus } from './plan'

import type { Corpus, CorpusDocument, CorpusSnapshotDocument } from './plan'

/** One transaction step. The caller turns these into client calls and nothing else. */
export type CorpusWrite =
  { op: 'createOrReplace'; document: CorpusDocument } | { op: 'delete'; _id: string }

/** Where a command reports. `console` satisfies it; a test captures the lines. */
export type CommandOutput = {
  log: (line: string) => void
  error: (line: string) => void
}

/**
 * Every source is written, settled or not: `createOrReplace` against a
 * deterministic id is idempotent, and writing the whole corpus is what makes a
 * re-run a repair rather than a diff to trust.
 *
 * Documents go out **published**. A draft of one can only be an accident —
 * every field is `readOnly` in Studio — but it would shadow the synced copy for
 * anything reading with the drafts perspective, so it goes too.
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
    writes.push({ op: 'createOrReplace', document })
  }

  for (const orphan of plan.orphans) {
    out.log(`  retired   ${orphan._id}  ← no longer in the corpus`)
    writes.push({ op: 'delete', _id: orphan._id })
    writes.push({ op: 'delete', _id: `drafts.${orphan._id}` })
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
