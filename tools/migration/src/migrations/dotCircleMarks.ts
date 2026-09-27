/** Report by default. Apply only after the Dot Circle renderer is deployed. */
import { readFileSync } from 'node:fs'
import { getCliClient } from 'sanity/cli'
import {
  DOT_CIRCLE_PAGE_IDS,
  DOT_CIRCLE_SOURCES,
  planDotCircleMarks,
  type DotCircleMarkRow,
} from './dotCircleMarksPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

/** Each export's asset id, as the seed pipeline recorded it in `data/assets.json`. */
function dotCircleIcons(): Record<string, string> {
  const assets = JSON.parse(
    readFileSync(new URL('../../data/assets.json', import.meta.url), 'utf8'),
  ) as Record<string, { assetId?: string }>
  const icons: Record<string, string> = {}
  for (const [icon, source] of Object.entries(DOT_CIRCLE_SOURCES)) {
    const assetId = assets[`file:${source}`]?.assetId
    if (!assetId) throw new Error(`No recorded asset for ${source}`)
    icons[assetId] = icon
  }
  return icons
}

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const datasetIndex = args.indexOf('--dataset')
  const dataset = datasetIndex >= 0 ? args[datasetIndex + 1] : undefined
  if (!dataset || dataset.startsWith('--') || dataset !== client.config().dataset)
    throw new Error('Pass --dataset matching the configured dataset explicitly')
  if (client.config().projectId !== 'naorcr6k')
    throw new Error('This migration is only for the O3 project')
  const icons = dotCircleIcons()
  const rows = await client.fetch<DotCircleMarkRow[]>(
    '*[_id in $ids]',
    { ids: DOT_CIRCLE_PAGE_IDS.flatMap((id) => [id, `drafts.${id}`]) },
    { perspective: 'raw' },
  )
  if (new Set(rows.map((row) => row._id)).size !== rows.length)
    throw new Error('Duplicate document identities')
  for (const id of DOT_CIRCLE_PAGE_IDS)
    if (rows.filter((row) => row._id === id).length !== 1)
      throw new Error(`Expected exactly one published document: ${id}`)
  const plans = rows.map((row) => planDotCircleMarks(row, icons)).filter((plan) => plan !== null)
  console.log(`${client.config().projectId}/${dataset}`)
  if (!plans.length) {
    console.log('No change: every Dot Circle artwork mark is already a Dot Circle.')
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
    `Updated only mark kind and icon in ${plans.length} page version(s); no draft published.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
