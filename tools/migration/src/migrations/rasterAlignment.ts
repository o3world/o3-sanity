/** Report by default. Deploy the reviewed renderer before applying these presentation settings. */
import { getCliClient } from 'sanity/cli'
import {
  planRasterAlignment,
  RASTER_ALIGNMENT_IDS,
  SOLUTIONS_ALIGNMENT_ID,
  type RasterAlignmentRow,
} from './rasterAlignmentPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const datasetIndex = args.indexOf('--dataset')
  const dataset = datasetIndex >= 0 ? args[datasetIndex + 1] : undefined
  if (!dataset || dataset.startsWith('--') || dataset !== client.config().dataset)
    throw new Error('Pass --dataset matching the configured dataset explicitly')
  if (client.config().projectId !== 'naorcr6k')
    throw new Error('This migration is only for the O3 project')
  const solutions = args.includes('--solutions')
  const allowLocked = args.includes('--allow-locked')
  if (allowLocked && !solutions)
    throw new Error('--allow-locked is only valid with the separate --solutions scope')
  const publishedIds = solutions ? [SOLUTIONS_ALIGNMENT_ID] : RASTER_ALIGNMENT_IDS
  const rows = await client.fetch<RasterAlignmentRow[]>(
    '*[_id in $ids]{_id,_rev,_type,slug,migration,sections[]{_key,_type,variant,surface,alignment,width,columns,bleed,layout}}',
    { ids: publishedIds.flatMap((id) => [id, `drafts.${id}`]) },
    { perspective: 'raw' },
  )
  for (const id of publishedIds) {
    if (rows.filter((row) => row._id === id).length !== 1)
      throw new Error(`Expected exactly one published page: ${id}`)
  }
  if (new Set(rows.map((row) => row._id)).size !== rows.length)
    throw new Error('Duplicate document identities')
  const plans = rows
    .map((row) => planRasterAlignment(row, allowLocked))
    .filter((plan) => plan !== null)
  console.log(
    `${client.config().projectId}/${dataset} — ${solutions ? 'Solutions only' : 'Home, About, Partner, Engineering'}`,
  )
  if (!plans.length) {
    console.log('No change: reviewed presentation settings are already active in every version.')
    return
  }
  console.log(JSON.stringify(plans, null, 2))
  if (!args.includes('--apply')) {
    console.log('Dry run only; no document changed.')
    return
  }
  const transaction = client.transaction()
  for (const plan of plans)
    transaction.patch(plan.id, (patch) => patch.ifRevisionId(plan.revision).set(plan.set))
  await transaction.commit()
  console.log(
    `Updated only reviewed presentation fields in ${plans.length} version(s); no draft published.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
