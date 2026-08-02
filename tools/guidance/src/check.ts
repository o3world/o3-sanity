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
 * report nobody reads.
 */
import { getCliClient } from 'sanity/cli'

import { readGuidance } from './sources'

const client = getCliClient({ apiVersion: '2026-07-01' })

type LiveDoc = { _id: string; key?: string; title?: string; body?: string; sourcePath?: string }

async function main() {
  const expected = readGuidance()
  const { projectId, dataset } = client.config()

  const live = await client.fetch<LiveDoc[]>(
    '*[_type == "guidance" && !(_id in path("drafts.**"))]{_id, key, title, body, sourcePath}',
  )
  const liveById = new Map(live.map((doc) => [doc._id, doc]))

  console.log(
    `repo: ${expected.length} guidance document(s) · dataset: ${live.length} · ${projectId}/${dataset}\n`,
  )

  const findings: string[] = []
  for (const doc of expected) {
    const actual = liveById.get(doc._id)
    if (!actual) {
      findings.push(`${doc._id} is missing from the dataset`)
      continue
    }
    const fields = (['key', 'title', 'body', 'sourcePath'] as const).filter(
      (field) => actual[field] !== doc[field],
    )
    if (fields.length > 0) {
      findings.push(`${doc._id} drifted from ${doc.sourcePath}: ${fields.join(', ')}`)
      continue
    }
    console.log(`  ✓ ${doc._id}  ${doc.sourcePath}`)
  }

  const known = new Set(expected.map((doc) => doc._id))
  for (const doc of live) {
    if (!known.has(doc._id)) findings.push(`${doc._id} has no source in GUIDANCE_SOURCES`)
  }

  if (findings.length > 0) {
    console.error(`\n✗ guidance has drifted (${findings.length}) — run \`pnpm guidance:sync\`:`)
    for (const line of findings) console.error(`    ${line}`)
    process.exitCode = 1
  } else {
    console.log('\nguidance matches the repo')
  }
}

await main()
