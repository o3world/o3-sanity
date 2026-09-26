/** Report by default. Apply only after the media section variants are deployed. */
import { readFileSync } from 'node:fs'
import { getCliClient } from 'sanity/cli'
import {
  planAboutComposition,
  readAboutCompositionAssets,
  type AboutCompositionRow,
} from './aboutCompositionPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const value = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined)
  const dataset = value('--dataset')
  if (!dataset || dataset.startsWith('--') || dataset !== client.config().dataset)
    throw new Error('Pass --dataset matching the configured dataset explicitly')
  if (client.config().projectId !== 'naorcr6k')
    throw new Error('This migration is only for the O3 project')
  const path = value('--assets')
  if (!path || path.startsWith('--'))
    throw new Error('Pass --assets with the JSON asset-reference file')
  const assets = readAboutCompositionAssets(JSON.parse(readFileSync(path, 'utf8')))
  const foundAssets = await client.fetch<string[]>(
    '*[_type == "sanity.imageAsset" && _id in $ids]._id',
    { ids: Object.values(assets) },
  )
  if (Object.values(assets).some((id) => !foundAssets.includes(id)))
    throw new Error('A supplied image asset does not exist in the configured dataset')
  const rows = await client.fetch<AboutCompositionRow[]>(
    '*[_id in ["page-seed-about", "drafts.page-seed-about"]]{_id,_rev,_type,slug,migration,sections}',
    {},
    { perspective: 'raw' },
  )
  if (
    rows.filter((row) => row._id === 'page-seed-about').length !== 1 ||
    new Set(rows.map((row) => row._id)).size !== rows.length
  )
    throw new Error('Expected one published About page and at most one draft')
  const plans = rows.map((row) => planAboutComposition(row, assets)).filter((plan) => plan !== null)
  console.log(`${client.config().projectId}/${dataset}`)
  console.log(
    JSON.stringify(
      plans.map(({ id, revision, set }) => ({
        id,
        revision,
        sectionKeys: set.sections.map((section) => section._key),
        change:
          'Move existing team figure; add Philly feature; reorder existing sections without replacing content',
      })),
      null,
      2,
    ),
  )
  if (!plans.length) {
    console.log('No change: About composition already migrated')
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
  console.log(`Updated About composition in ${plans.length} version(s); no draft published.`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
