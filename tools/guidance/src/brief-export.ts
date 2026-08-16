/**
 * Export → a brief born in the dataset becomes markdown in the corpus, so it
 * survives a rebuild (ADR 0027).
 *
 *   pnpm brief:export           # what there is to export
 *   pnpm brief:export <key>     # export one
 *
 * Manual and on demand. Nothing runs this for you, and a brief nobody exports
 * is a brief a rebuild deletes — the ADR's standing bet, not an oversight.
 *
 * The plan decides what to export and what to refuse (`src/corpus/`); this file
 * supplies the client and the filesystem. What it writes is one markdown file
 * and one transaction: the file, and the dataset copy stamped with the
 * `sourcePath` that makes it file-backed from here on.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { getCliClient } from 'sanity/cli'

import { BRIEF_DIR, BRIEF_TYPE, briefCorpus } from './briefs'
import { commitWrites } from './commit'
import { exportCorpus } from './corpus/commands'
import { normalizeSnapshot } from './corpus/plan'
import { pathsIn } from './corpus/read'
import { REPO_ROOT } from './repo'

import type { CorpusSnapshotDocument } from './corpus/plan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const corpus = briefCorpus()
  const [key] = process.argv.slice(2)
  const { projectId, dataset } = client.config()
  console.log(`briefs born in ${projectId}/${dataset}\n`)

  /* Whole documents, not the projection sync compares on: exporting a draft
   * publishes everything it holds, and the fields the markdown cannot carry —
   * `instructions`, `links`, `record` — are what the report names. Drafts are
   * included because the authoring skill never publishes one. */
  const snapshot = normalizeSnapshot(
    await client.fetch<CorpusSnapshotDocument[]>(`*[_type == $type]`, { type: BRIEF_TYPE }),
  )

  const { file, writes, status } = exportCorpus(
    corpus,
    snapshot,
    { key, directory: BRIEF_DIR, occupied: pathsIn(REPO_ROOT, BRIEF_DIR) },
    console,
  )

  if (file) {
    mkdirSync(join(REPO_ROOT, BRIEF_DIR), { recursive: true })
    writeFileSync(join(REPO_ROOT, file.sourcePath), file.contents, 'utf8')

    const tx = client.transaction()
    commitWrites(tx, writes)
    await tx.commit({ visibility: 'sync' })

    console.log(`\ndone — commit ${file.sourcePath}; \`pnpm brief:sync\` now has nothing to write`)
  }

  process.exitCode = status
}

await main()
