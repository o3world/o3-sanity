/** Report by default. Apply only after the brand button renderer is deployed. */
import { getCliClient } from 'sanity/cli'
import { planHomeShowcaseButton, type HomeShowcaseRow } from './homeShowcaseButtonPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const datasetIndex = args.indexOf('--dataset')
  const dataset = datasetIndex >= 0 ? args[datasetIndex + 1] : undefined
  if (!dataset || dataset.startsWith('--') || dataset !== client.config().dataset) {
    throw new Error('Pass --dataset matching the configured dataset explicitly')
  }
  if (client.config().projectId !== 'naorcr6k')
    throw new Error('This migration is only for the O3 project')
  const rows = await client.fetch<HomeShowcaseRow[]>(
    '*[_id in ["page-seed-index", "drafts.page-seed-index"]]{_id,_rev,_type,slug,migration,sections[]{_key,_type,button{contrast}}}',
    {},
    { perspective: 'raw' },
  )
  if (rows.filter((row) => row._id === 'page-seed-index').length !== 1)
    throw new Error('Expected exactly one published Home page')
  if (new Set(rows.map((row) => row._id)).size !== rows.length)
    throw new Error('Duplicate Home document identities')
  const plans = rows.map(planHomeShowcaseButton).filter((plan) => plan !== null)
  console.log(`${client.config().projectId}/${dataset}`)
  if (!plans.length) {
    console.log('No change: Home showcase button needs no change')
    return
  }
  console.log(JSON.stringify(plans, null, 2))
  if (!args.includes('--apply')) {
    console.log('Dry run only; no document changed.')
    return
  }
  const transaction = client.transaction()
  for (const plan of plans) {
    transaction.patch(plan.id, (patch) => patch.ifRevisionId(plan.revision).set(plan.set))
  }
  await transaction.commit()
  console.log(
    `Updated only showcase button contrast in ${plans.length} Home version(s); no draft published.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
