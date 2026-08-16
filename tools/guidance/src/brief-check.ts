/**
 * Check → is the dataset's file-backed briefs still what the repo says they
 * are? (ADR 0027)
 *
 *   pnpm brief:check
 *
 * Exits non-zero on any drift, so it works as a checkpoint rather than a report
 * nobody reads. It audits **file-backed** briefs only: a brief with no
 * `sourcePath` was written in the dataset by the authoring skill, and this
 * command's silence about one says nothing about whether it is any good.
 * The verdicts come from the corpus plan (`src/corpus/`); this file supplies
 * the client.
 */
import { getCliClient } from 'sanity/cli'

import { BRIEF_FIELDS, BRIEF_TYPE, briefCorpus } from './briefs'
import { checkCorpus } from './corpus/commands'

import type { CorpusSnapshotDocument } from './corpus/plan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const corpus = briefCorpus()
  const { projectId, dataset } = client.config()

  const snapshot = await client.fetch<CorpusSnapshotDocument[]>(
    `*[_type == $type && !(_id in path("drafts.**"))]{_id, ${BRIEF_FIELDS.join(', ')}}`,
    { type: BRIEF_TYPE },
  )

  console.log(
    `repo: ${corpus.sources.length} file-backed brief(s) · dataset: ${snapshot.length} · ${projectId}/${dataset}\n`,
  )

  process.exitCode = checkCorpus(corpus, snapshot, console)
}

await main()
