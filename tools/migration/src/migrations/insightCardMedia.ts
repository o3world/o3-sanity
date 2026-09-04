/**
 * Targeted migration — every insight's picture becomes its card picture.
 *
 * An insight's one `featuredImage` had to be both the article's lead
 * photograph and its thumbnail in a feed. The document now carries
 * `heroMedia` and `cardMedia`, one job each (#416), and what every existing
 * article holds is, in the new vocabulary, the card picture. This copies it
 * there — asset reference, alt text and caption, whole — and writes the
 * committed JSON in the same run, so the record matches the dataset the
 * removal (#421) will leave behind.
 *
 * **NOTHING READS THE NEW FIELD YET.** The renderers still draw
 * `featuredImage` when this runs, which is what makes it safe to run first:
 * the site renders exactly what it rendered before, and #419 then switches
 * the read chain over to a corpus that is already populated.
 *
 * `featuredImage` is left in place on the document. This is a copy, not a
 * move: the dataset keeps its old field until #421 removes it on a count.
 *
 * **`migration.locked` DOES NOT APPLY**, for the reason `statsToBand` sets
 * out — see the plan module's own note.
 *
 *   pnpm --filter @o3/migration insight-card-media                  # report only
 *   pnpm --filter @o3/migration insight-card-media -- --apply       # write
 *
 * Read-only unless `--apply`. It refuses any dataset but `development`
 * without `--dataset <name>` spelled out.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { getCliClient } from 'sanity/cli'

import { CONVERTED_DIR } from '../lib/paths'
import { planInsightCardMedia, type InsightFile, type InsightRow } from './insightCardMediaPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

const argv = process.argv.slice(2)
const apply = argv.includes('--apply')
const namedDataset = argv[argv.indexOf('--dataset') + 1]

/** Drafts fall out of this too — they are documents in the same dataset. */
const QUERY = /* groq */ `*[_type == "insight"]{
  _id, title, featuredImage, cardMedia
} | order(_id asc)`

const INSIGHT_DIR = join(CONVERTED_DIR, 'insight')

function readInsightFiles(): InsightFile[] {
  return readdirSync(INSIGHT_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({
      path: join(INSIGHT_DIR, name),
      doc: JSON.parse(readFileSync(join(INSIGHT_DIR, name), 'utf8')) as Record<string, unknown>,
    }))
}

async function main() {
  const dataset = client.config().dataset
  if (dataset !== 'development' && namedDataset !== dataset) {
    throw new Error(
      `refusing to touch "${dataset}" — pass --dataset ${dataset} to say so out loud, ` +
        `or run \`pnpm dataset development\` first.`,
    )
  }

  const rows = await client.fetch<InsightRow[]>(QUERY)
  const files = readInsightFiles()
  const plan = planInsightCardMedia(rows, files)

  console.log(
    `${client.config().projectId}/${dataset} — ${rows.length} insight(s), ${files.length} committed file(s)\n`,
  )
  for (const skip of plan.skips) console.log(`  skip   ${skip.subject} — ${skip.why}`)
  for (const patch of plan.patches) console.log(`  ${apply ? 'write' : 'would'}  ${patch._id}`)
  console.log(
    `\n${plan.patches.length} document(s) and ${plan.rewrites.length} file(s) would change.`,
  )

  if (!apply) {
    console.log('Re-run with --apply.')
    return
  }
  if (plan.patches.length === 0 && plan.rewrites.length === 0) {
    console.log('nothing to do')
    return
  }

  // One transaction: the whole batch lands or none of it does, so a failure
  // halfway leaves nothing to reconcile by hand.
  if (plan.patches.length > 0) {
    const tx = plan.patches.reduce(
      (acc, patch) => acc.patch(patch._id, (p) => p.set({ cardMedia: patch.cardMedia })),
      client.transaction(),
    )
    await tx.commit()
  }

  for (const rewrite of plan.rewrites) {
    writeFileSync(rewrite.path, `${JSON.stringify(rewrite.doc, null, 2)}\n`)
  }

  console.log(
    `\nwrote ${plan.patches.length} document(s) to ${dataset} and ${plan.rewrites.length} file(s)`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
