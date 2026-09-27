/** Report by default; apply only after the matching presentation renderer is deployed. */
import { readFileSync, writeFileSync } from 'node:fs'
import { getCliClient } from 'sanity/cli'
import {
  planPresentationAlignment,
  readPresentationAssets,
  PRESENTATION_IDS,
  PRESENTATION_EXISTING_ASSETS,
  type PresentationRow,
} from './presentationAlignmentPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const values: Record<string, string> = {}
  const flags = new Set<string>()
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!
    if (['--apply', '--allow-locked-solutions'].includes(arg)) {
      if (flags.has(arg)) throw new Error(`Duplicate argument: ${arg}`)
      flags.add(arg)
    } else if (['--project', '--dataset', '--assets', '--backup'].includes(arg)) {
      const value = args[++index]
      if (!value || value.startsWith('--') || values[arg])
        throw new Error(`Invalid argument: ${arg}`)
      values[arg] = value
    } else throw new Error(`Unknown argument: ${arg}`)
  }
  if (values['--project'] !== 'naorcr6k' || client.config().projectId !== values['--project'])
    throw new Error('Pass --project naorcr6k matching the configured project explicitly')
  const dataset = values['--dataset']
  if (
    !dataset ||
    !['development', 'production'].includes(dataset) ||
    dataset !== client.config().dataset
  )
    throw new Error(
      'Pass --dataset development or production matching the configured dataset explicitly',
    )
  if (!values['--assets']) throw new Error('Pass --assets with the reviewed JSON asset references')
  const assets = readPresentationAssets(JSON.parse(readFileSync(values['--assets'], 'utf8')))
  const expectedAssets = [...new Set([...Object.values(assets), ...PRESENTATION_EXISTING_ASSETS])]
  const foundAssets = await client.fetch<string[]>(
    '*[_type == "sanity.imageAsset" && _id in $ids]._id',
    { ids: expectedAssets },
    { perspective: 'raw' },
  )
  if (expectedAssets.some((id) => !foundAssets.includes(id)))
    throw new Error('A reviewed asset does not exist in the configured dataset')
  const rows = await client.fetch<PresentationRow[]>(
    '*[_id in $ids]',
    { ids: PRESENTATION_IDS.flatMap((id) => [id, `drafts.${id}`]) },
    { perspective: 'raw' },
  )
  if (new Set(rows.map((row) => row._id)).size !== rows.length)
    throw new Error('Duplicate document identities')
  for (const id of PRESENTATION_IDS)
    if (rows.filter((row) => row._id === id).length !== 1)
      throw new Error(`Expected exactly one published document: ${id}`)
  const results = rows.map((row) =>
    planPresentationAlignment(row, assets, flags.has('--allow-locked-solutions')),
  )
  const plans = results.filter((plan) => Object.keys(plan.set).length)
  console.log(`${values['--project']}/${dataset}`)
  console.log(
    JSON.stringify({ plans, preserved: results.flatMap((plan) => plan.skipped) }, null, 2),
  )
  if (!plans.length) {
    console.log('No change: reviewed presentation fields are already aligned.')
    return
  }
  if (!flags.has('--apply')) {
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
        project: values['--project'],
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
  for (const plan of plans)
    transaction.patch(plan.id, (patch) => patch.ifRevisionId(plan.revision).set(plan.set))
  await transaction.commit()
  console.log(
    `Updated presentation fields in ${plans.length} version(s); locks and draft states preserved.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
