/**
 * Targeted migration: give the homepage platforms band and its three panels
 * their anchors, so the tabs link as `#tech-platforms-sanity`, `-vercel` and
 * `-lovable` (OWSW-117). The plan is in `platformAnchorsPlan.ts`.
 *
 * It reads the homepage and its draft, raw, and gives each one that needs it
 * one `set` patch guarded by the revision it was read at. An edit made between
 * the read and the write fails the transaction instead of being overwritten. A
 * draft is patched as a draft; nothing is published. A rerun finds nothing and
 * writes nothing.
 *
 *   pnpm --filter @o3/migration platform-anchors -- --dataset production           # report only
 *   pnpm --filter @o3/migration platform-anchors -- --dataset production --apply   # write
 *
 * `--dataset` is required every time and must name the configured dataset.
 */
import { getCliClient } from 'sanity/cli'

import { planPlatformAnchors, type AnchorRow } from './platformAnchorsPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

const HOME = ['page-seed-index', 'drafts.page-seed-index']
const QUERY = /* groq */ `*[_id in $ids]{_id, _rev, migration, sections} | order(_id asc)`

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const apply = args.includes('--apply')
  const dataset = client.config().dataset
  const named = args.includes('--dataset') ? args[args.indexOf('--dataset') + 1] : undefined
  if (!named || named !== dataset)
    throw new Error(
      `refusing to touch "${dataset}" — pass --dataset ${dataset} to say so out loud.`,
    )

  const rows = await client.fetch<AnchorRow[]>(QUERY, { ids: HOME }, { perspective: 'raw' })
  console.log(
    `${client.config().projectId}/${dataset} — read ${rows.map((r) => r._id).join(', ') || 'nothing'}\n`,
  )

  const plans = rows.map(planPlatformAnchors).filter((plan) => plan !== null)
  for (const plan of plans) {
    for (const [path, name] of Object.entries(plan.set))
      console.log(`  ${apply ? 'set  ' : 'would'}  ${plan.id}  ${path} = "${name}"`)
    for (const note of plan.kept) console.log(`  keep   ${plan.id}  ${note}`)
  }

  const writes = plans.filter((plan) => Object.keys(plan.set).length > 0)
  if (!apply) {
    console.log(`\n${writes.length} document(s) would change. Re-run with --apply.`)
    return
  }
  if (writes.length === 0) {
    console.log('\nnothing to do')
    return
  }

  const tx = writes.reduce(
    (acc, plan) => acc.patch(plan.id, (patch) => patch.ifRevisionId(plan.revision).set(plan.set)),
    client.transaction(),
  )
  await tx.commit()
  console.log(`\nwrote ${writes.length} document(s) to ${dataset}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
