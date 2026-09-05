/** Report by default. Apply only after the optional heading setting is deployed. */
import { getCliClient } from 'sanity/cli'
import { planAboutHeading, type AboutHeadingRow } from './aboutHeadingPlan'

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
  const rows = await client.fetch<AboutHeadingRow[]>(
    '*[_id in ["page-seed-about", "drafts.page-seed-about"]]{_id,_rev,_type,slug,migration,sections[]{_key,_type,headingLevel}}',
    {},
    { perspective: 'raw' },
  )
  if (rows.some((row) => row._id.startsWith('drafts.')))
    throw new Error('About has a draft; reconcile it before applying this correction')
  const row = rows[0]
  if (rows.length !== 1 || !row) throw new Error('Expected one published About page')
  const plan = planAboutHeading(row)
  console.log(`${client.config().projectId}/${dataset}`)
  if (!plan) {
    console.log('No change: About already uses the section heading')
    return
  }
  console.log(JSON.stringify(plan, null, 2))
  if (!args.includes('--apply')) {
    console.log('Dry run only; no document changed.')
    return
  }
  await client.patch(plan.id).ifRevisionId(plan.revision).set(plan.set).commit()
  console.log('Updated only About sections[_key=="why"].headingLevel')
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
