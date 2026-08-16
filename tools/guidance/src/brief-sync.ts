/**
 * Sync → push the repo's file-backed briefs into the dataset (ADR 0027).
 *
 * A brief is what one piece of content was written from. Briefing a piece is
 * dropping a markdown file in `tools/guidance/briefs/`, running this, and
 * pointing a `briefs` reference at `brief-<key>`:
 *
 *   pnpm brief:sync
 *
 * The plan decides what to write (`src/corpus/`); this file supplies the
 * client. Two things differ from `guidance:sync`, both from the ADR. Documents
 * are patched rather than replaced, so the `record` the authoring skill wrote
 * survives. And a brief with no `sourcePath` was born in the dataset — this
 * never touches one, and refuses to sync a file that asks for its id, exiting
 * non-zero instead.
 */
import { getCliClient } from 'sanity/cli'

import { BRIEF_DIR, BRIEF_FIELDS, BRIEF_TYPE, briefCorpus } from './briefs'
import { commitWrites } from './commit'
import { syncCorpus } from './corpus/commands'
import { normalizeSnapshot } from './corpus/plan'

import type { CorpusSnapshotDocument } from './corpus/plan'

/* `raw`, because the default perspective hides drafts and the document a key
 * collision would destroy is usually one the authoring skill never published
 * (ADR 0027). `normalizeSnapshot` folds the two copies back into one row. */
const client = getCliClient({ apiVersion: '2026-07-01', perspective: 'raw' })

async function main() {
  const corpus = briefCorpus()
  const { projectId, dataset } = client.config()
  console.log(
    `syncing ${corpus.sources.length} brief(s) from ${BRIEF_DIR} → ${projectId}/${dataset}\n`,
  )

  const snapshot = normalizeSnapshot(
    await client.fetch<CorpusSnapshotDocument[]>(
      `*[_type == $type]{_id, ${BRIEF_FIELDS.join(', ')}}`,
      { type: BRIEF_TYPE },
    ),
  )

  const tx = client.transaction()
  const { writes, status } = syncCorpus(corpus, snapshot, console)
  commitWrites(tx, writes)

  await tx.commit({ visibility: 'sync' })
  process.exitCode = status
  console.log(`\ndone — a piece reaches its briefs with briefs[]->{title, background, record}`)
}

await main()
