/** Dry run by default. Patches one field per version; never publishes a draft. */
import { getCliClient } from 'sanity/cli'
import { planO3xoCardFit, type CardFitRow } from './o3xoCardFitPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const at = args.indexOf('--dataset')
  const dataset = at >= 0 ? args[at + 1] : undefined
  if (!dataset || dataset.startsWith('--') || dataset !== client.config().dataset)
    throw new Error('Pass --dataset matching the configured dataset explicitly')
  if (client.config().projectId !== 'naorcr6k') throw new Error('Expected the O3 project')
  const rows = await client.fetch<CardFitRow[]>(
    '*[_id in ["page-seed-index", "drafts.page-seed-index", "page-seed-about", "drafts.page-seed-about"]]{_id,_rev,_type,migration{locked},sections[]{_key,_type,items[]{_key,_type,heading,fit}}}',
    {},
    { perspective: 'raw' },
  )
  for (const id of ['page-seed-index', 'page-seed-about'])
    if (rows.filter((row) => row._id === id).length !== 1)
      throw new Error(`Expected one published ${id}`)
  const plans = rows.map(planO3xoCardFit).filter((plan) => plan !== null)
  console.log(`${client.config().projectId}/${dataset}`)
  console.log(JSON.stringify(plans, null, 2))
  if (!plans.length) return console.log('No change: both O3XO cards already contain their artwork.')
  if (!args.includes('--apply')) return console.log('Dry run only; no document changed.')
  const transaction = client.transaction()
  for (const plan of plans)
    transaction.patch(plan.id, (patch) => patch.ifRevisionId(plan.revision).set(plan.set))
  await transaction.commit()
  console.log(`Set O3XO fit in ${plans.length} versions; all other content and drafts preserved.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
