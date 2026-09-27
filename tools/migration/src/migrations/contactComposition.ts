/** Report by default. Apply only after the form hero renderer is deployed. */
import { getCliClient } from 'sanity/cli'
import { planContactComposition, type ContactCompositionRow } from './contactCompositionPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const datasetIndex = args.indexOf('--dataset')
  const dataset = datasetIndex >= 0 ? args[datasetIndex + 1] : undefined
  if (!dataset || dataset.startsWith('--') || dataset !== client.config().dataset)
    throw new Error('Pass --dataset matching the configured dataset explicitly')
  if (client.config().projectId !== 'naorcr6k')
    throw new Error('This migration is only for the O3 project')
  const rows = await client.fetch<ContactCompositionRow[]>(
    '*[_id in ["page-seed-contact", "drafts.page-seed-contact"]]{_id,_rev,_type,slug,migration,sections}',
    {},
    { perspective: 'raw' },
  )
  if (
    rows.filter((row) => row._id === 'page-seed-contact').length !== 1 ||
    new Set(rows.map((row) => row._id)).size !== rows.length
  )
    throw new Error('Expected one published Contact page and at most one draft')
  const plans = rows.map(planContactComposition).filter((plan) => plan !== null)
  console.log(`${client.config().projectId}/${dataset}`)
  console.log(
    JSON.stringify(
      plans.map(({ id, revision, set }) => ({
        id,
        revision,
        sectionCount: set.sections.length,
        change: 'Move existing introduction into form; preserve fields and secondary content',
      })),
      null,
      2,
    ),
  )
  if (!plans.length) {
    console.log('No change: Contact composition already migrated')
    return
  }
  if (!args.includes('--apply')) {
    console.log('Dry run only; no document changed.')
    return
  }
  const transaction = client.transaction()
  for (const plan of plans)
    transaction.patch(plan.id, (patch) => patch.ifRevisionId(plan.revision).set(plan.set))
  await transaction.commit()
  console.log(`Updated Contact composition in ${plans.length} version(s); no draft published.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
