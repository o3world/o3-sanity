/** Read-only migration proposal. No apply mode until the asset and lock decisions are resolved. */
import { getCliClient } from 'sanity/cli'
import { planIronmanGridSpans, type IronmanGridRow } from './ironmanGridSpansPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const dataset = args[1]
  if (
    args.length !== 2 ||
    args[0] !== '--dataset' ||
    !dataset ||
    !['development', 'production'].includes(dataset) ||
    dataset !== client.config().dataset ||
    client.config().projectId !== 'naorcr6k'
  )
    throw new Error(
      'Report only: pass --dataset development or production matching the O3 configuration',
    )
  const rows = await client.fetch<IronmanGridRow[]>(
    '*[_id in ["caseStudy-wp-10028", "drafts.caseStudy-wp-10028"]]',
    {},
    { perspective: 'raw' },
  )
  if (rows.filter((row) => row._id === 'caseStudy-wp-10028').length !== 1)
    throw new Error('Expected exactly one published Ironman case study')
  const plans = rows.map(planIronmanGridSpans).filter((plan) => plan !== null)
  console.log(`${client.config().projectId}/${dataset}`)
  console.log(JSON.stringify(plans, null, 2))
  console.log('Dry proposal only; no document or asset changed. No apply mode is provided.')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
