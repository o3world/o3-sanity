/**
 * Check → is the dataset's file-backed briefs still what the repo says they
 * are? (ADR 0027)
 *
 *   pnpm brief:check
 *
 * Exits non-zero on any drift, so it works as a checkpoint rather than a report
 * nobody reads. It audits **file-backed** briefs only: a brief with no
 * `sourcePath` was written in the dataset by the authoring skill, and this
 * command's silence about one says nothing about whether it is any good. It
 * speaks about one in a single case — a markdown file asking for the id that
 * brief already holds, which no sync can settle.
 * The verdicts come from the corpus plan (`src/corpus/`); this file supplies
 * the client.
 */
import { getCliClient } from 'sanity/cli'

import { BRIEF_FIELDS, BRIEF_TYPE, briefCorpus } from './briefs'
import { checkCorpus } from './corpus/commands'
import { normalizeSnapshot } from './corpus/plan'

import type { CorpusSnapshotDocument } from './corpus/plan'

/* `raw`, because the default perspective hides drafts and the document a key
 * collision would destroy is usually one the authoring skill never published
 * (ADR 0027). `normalizeSnapshot` folds the two copies back into one row. */
const client = getCliClient({ apiVersion: '2026-07-01', perspective: 'raw' })

async function main() {
  const corpus = briefCorpus()
  const { projectId, dataset } = client.config()

  const snapshot = normalizeSnapshot(
    await client.fetch<CorpusSnapshotDocument[]>(
      `*[_type == $type]{_id, ${BRIEF_FIELDS.join(', ')}}`,
      { type: BRIEF_TYPE },
    ),
  )

  console.log(
    `repo: ${corpus.sources.length} file-backed brief(s) · dataset: ${snapshot.length} · ${projectId}/${dataset}\n`,
  )

  process.exitCode = checkCorpus(corpus, snapshot, console)
}

await main()
