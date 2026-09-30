/** Report only by default. Upload and patch only with an explicit --apply. */
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getCliClient } from 'sanity/cli'
import { ABOUT_PORTRAITS, planAboutPortrait, type PortraitRow } from './aboutPortraitsPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const values: Record<string, string> = {}
  let apply = false
  let dryRun = false
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!
    if (arg === '--apply' && !apply) apply = true
    else if (arg === '--dry-run' && !dryRun) dryRun = true
    else if (['--project', '--dataset', '--backup'].includes(arg)) {
      const value = args[++index]
      if (!value || value.startsWith('--') || values[arg])
        throw new Error(`Invalid argument: ${arg}`)
      values[arg] = value
    } else throw new Error(`Unknown or duplicate argument: ${arg}`)
  }
  if (apply && dryRun) throw new Error('--apply and --dry-run cannot be combined')
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
  const files = new Map(
    ABOUT_PORTRAITS.filter((target) => target.file).map((target) => {
      const path = resolve(
        fileURLToPath(new URL('../../data/seed/assets/', import.meta.url)),
        target.file!,
      )
      const bytes = readFileSync(path)
      const ref = `image-${createHash('sha1').update(bytes).digest('hex')}-790x790-png`
      if (ref !== target.asset) throw new Error(`Portrait bytes changed: ${target.file}`)
      return [target.asset, { bytes, file: target.file }]
    }),
  )
  const rows = await client.fetch<PortraitRow[]>(
    '*[_id in $ids]',
    {
      ids: ABOUT_PORTRAITS.flatMap((target) => [target.id, `drafts.${target.id}`]),
    },
    { perspective: 'raw' },
  )
  for (const target of ABOUT_PORTRAITS)
    if (rows.filter((row) => row._id === target.id).length !== 1)
      throw new Error(`Expected exactly one published person: ${target.id}`)
  if (new Set(rows.map((row) => row._id)).size !== rows.length)
    throw new Error('Duplicate document identities')
  const plans = [] as NonNullable<ReturnType<typeof planAboutPortrait>>[]
  const blocked: { id: string; reason: string; headshot: unknown }[] = []
  for (const row of rows) {
    try {
      const plan = planAboutPortrait(row)
      if (plan) plans.push(plan)
    } catch (error) {
      blocked.push({
        id: row._id,
        reason: error instanceof Error ? error.message : String(error),
        headshot: row.headshot,
      })
    }
  }
  const needed = [...new Set(plans.map((plan) => plan.set['headshot.asset']._ref))]
  const existing = await client.fetch<string[]>(
    '*[_type == "sanity.imageAsset" && _id in $ids]._id',
    { ids: needed },
    { perspective: 'raw' },
  )
  const uploads = needed.filter((ref) => !existing.includes(ref))
  for (const ref of uploads)
    if (!files.has(ref)) throw new Error(`Chosen existing portrait asset is missing: ${ref}`)
  console.log(`${values['--project']}/${dataset}`)
  console.log(JSON.stringify({ plans, uploads, blocked }, null, 2))
  if (!apply) {
    console.log('Dry run only; no asset uploaded and no document changed.')
    return
  }
  if (blocked.length)
    throw new Error('Refusing apply: reconcile the preserved portrait conflicts first')
  if (!plans.length) {
    console.log('No change: all reviewed portraits are already active.')
    return
  }
  if (!values['--backup']) throw new Error('Pass --backup with a new file path before applying')
  writeFileSync(
    values['--backup'],
    JSON.stringify(
      {
        project: values['--project'],
        dataset,
        capturedAt: new Date().toISOString(),
        documents: rows,
        plans,
      },
      null,
      2,
    ),
    { flag: 'wx', mode: 0o600 },
  )
  for (const ref of uploads) {
    const file = files.get(ref)!
    const uploaded = await client.assets.upload('image', file.bytes, { filename: file.file })
    if (uploaded._id !== ref) throw new Error(`Unexpected uploaded asset id: ${file.file}`)
  }
  const transaction = client.transaction()
  for (const plan of plans)
    transaction.patch(plan.id, (patch) => patch.ifRevisionId(plan.revision).set(plan.set))
  await transaction.commit()
  console.log(
    `Updated only headshot.asset in ${plans.length} person version(s); no draft published.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
