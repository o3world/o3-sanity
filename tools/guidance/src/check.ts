/**
 * Check → is the dataset's guidance still what the repo says it is? (#72)
 *
 * The failure this exists to catch is silent: an agent fetches guidance at
 * session start and follows it, so a stale document does not error — it just
 * makes everything written that session slightly wrong. Voice edits land in
 * git; this is what makes forgetting to sync them loud.
 *
 *   pnpm guidance:check
 *
 * Exits non-zero on any drift, so it works as a checkpoint rather than a
 * report nobody reads. The verdicts come from the corpus plan (`src/corpus/`);
 * this file supplies the client.
 */
import { getCliClient } from 'sanity/cli'

import { checkCorpus } from './corpus/commands'
import { GUIDANCE_TYPE, guidanceCorpus } from './sources'

import type { CorpusSnapshotDocument } from './corpus/plan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const corpus = guidanceCorpus()
  const { projectId, dataset } = client.config()

  const snapshot = await client.fetch<CorpusSnapshotDocument[]>(
    `*[_type == $type && !(_id in path("drafts.**"))]{_id, key, title, body, sourcePath}`,
    { type: GUIDANCE_TYPE },
  )

  console.log(
    `repo: ${corpus.sources.length} guidance document(s) · dataset: ${snapshot.length} · ${projectId}/${dataset}\n`,
  )

  process.exitCode = checkCorpus(corpus, snapshot, console)
}

await main()
