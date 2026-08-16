/**
 * Sync → push the repo's agent guidance into the dataset (#72).
 *
 * The authoring skill is a thin bootstrap that fetches its knowledge at
 * session start (#68), so the voice guide has to exist as a document an MCP
 * consumer can query — while staying editable as markdown in git. This is the
 * whole of that seam: markdown in, one published document per source out.
 *
 *   pnpm guidance:sync
 *
 * The plan decides what to write (`src/corpus/`); this file supplies the
 * client and commits what comes back. Ids are deterministic, so a re-run
 * replaces rather than duplicates, and a document whose source row is gone is
 * deleted — the dataset holds what the repo says and nothing else.
 */
import { getCliClient } from 'sanity/cli'

import { commitWrites } from './commit'
import { syncCorpus } from './corpus/commands'
import { idFor } from './corpus/plan'
import { GUIDANCE_FIELDS, GUIDANCE_TYPE, guidanceCorpus } from './sources'

import type { CorpusSnapshotDocument } from './corpus/plan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const corpus = guidanceCorpus()
  const { projectId, dataset } = client.config()
  console.log(`syncing ${corpus.sources.length} guidance document(s) → ${projectId}/${dataset}\n`)

  const snapshot = await client.fetch<CorpusSnapshotDocument[]>(
    `*[_type == $type && !(_id in path("drafts.**"))]{_id, ${GUIDANCE_FIELDS.join(', ')}}`,
    { type: GUIDANCE_TYPE },
  )

  const tx = client.transaction()
  const { writes, status } = syncCorpus(corpus, snapshot, console)
  commitWrites(tx, writes)

  await tx.commit({ visibility: 'sync' })
  process.exitCode = status
  console.log(`\ndone — query them with *[_type == "guidance"]{key, title, body}`)
  console.log(`the voice guide is ${idFor(GUIDANCE_TYPE, 'o3-voice')}`)
}

await main()
