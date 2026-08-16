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
 * never touches one.
 */
import { getCliClient } from 'sanity/cli'

import { BRIEF_DIR, BRIEF_FIELDS, BRIEF_TYPE, briefCorpus } from './briefs'
import { commitWrites } from './commit'
import { syncCorpus } from './corpus/commands'

import type { CorpusSnapshotDocument } from './corpus/plan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const corpus = briefCorpus()
  const { projectId, dataset } = client.config()
  console.log(
    `syncing ${corpus.sources.length} brief(s) from ${BRIEF_DIR} → ${projectId}/${dataset}\n`,
  )

  const snapshot = await client.fetch<CorpusSnapshotDocument[]>(
    `*[_type == $type && !(_id in path("drafts.**"))]{_id, ${BRIEF_FIELDS.join(', ')}}`,
    { type: BRIEF_TYPE },
  )

  const tx = client.transaction()
  commitWrites(tx, syncCorpus(corpus, snapshot, console))

  await tx.commit({ visibility: 'sync' })
  console.log(`\ndone — a piece reaches its briefs with briefs[]->{title, background, record}`)
}

await main()
