/** Report by default. Apply only after the feature gallery renderer is deployed. */
import { writeFileSync } from 'node:fs'
import { getCliClient } from 'sanity/cli'
import { planBestEggGalleryLayout, type BestEggGalleryRow } from './bestEggGalleryLayoutPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const values: Record<string, string> = {}
  let apply = false
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!
    if (arg === '--apply' && !apply) apply = true
    else if (['--dataset', '--backup'].includes(arg)) {
      const value = args[++index]
      if (!value || value.startsWith('--') || values[arg])
        throw new Error(`Invalid argument: ${arg}`)
      values[arg] = value
    } else throw new Error(`Unknown or duplicate argument: ${arg}`)
  }
  const dataset = values['--dataset']
  if (
    !dataset ||
    !['development', 'production'].includes(dataset) ||
    dataset !== client.config().dataset
  )
    throw new Error(
      'Pass --dataset development or production matching the configured dataset explicitly',
    )
  if (client.config().projectId !== 'naorcr6k')
    throw new Error('This migration is only for the O3 project')
  const rows = await client.fetch<BestEggGalleryRow[]>(
    '*[_id in ["caseStudy-wp-5803", "drafts.caseStudy-wp-5803"]]',
    {},
    { perspective: 'raw' },
  )
  if (rows.filter((row) => row._id === 'caseStudy-wp-5803').length !== 1)
    throw new Error('Expected exactly one published Best Egg case study')
  if (new Set(rows.map((row) => row._id)).size !== rows.length)
    throw new Error('Duplicate Best Egg document identities')
  const plans = rows.map(planBestEggGalleryLayout).filter((plan) => plan !== null)
  console.log(`${client.config().projectId}/${dataset}`)
  if (!plans.length) {
    console.log('No change: Best Egg gallery already uses feature layout in every version')
    return
  }
  console.log(JSON.stringify(plans, null, 2))
  if (!apply) {
    console.log('Dry run only; no document changed.')
    return
  }
  const backup = values['--backup']
  if (!backup) throw new Error('Pass --backup with a new file path before applying')
  const ids = new Set(plans.map((plan) => plan.id))
  writeFileSync(
    backup,
    JSON.stringify(
      {
        project: client.config().projectId,
        dataset,
        capturedAt: new Date().toISOString(),
        documents: rows.filter((row) => ids.has(row._id)),
        plans,
      },
      null,
      2,
    ),
    { flag: 'wx', mode: 0o600 },
  )
  console.log(`Scoped backup saved: ${backup}`)
  const transaction = client.transaction()
  for (const plan of plans) {
    transaction.patch(plan.id, (patch) => patch.ifRevisionId(plan.revision).set(plan.set))
  }
  await transaction.commit()
  console.log(
    `Updated only gallery layout in ${plans.length} Best Egg version(s); no draft published.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
