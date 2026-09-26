/** Report first; revision-guarded, field-scoped copy alignment for the unlaunched O3 site. */
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getCliClient } from 'sanity/cli'
import contentManifest from './figmaContentAlignment.json'
import finishManifest from './figmaAlignmentFinish.json'
import { planFigmaContentAlignment, type ContentRow } from './figmaContentAlignmentPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })
async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const value = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined)
  const dataset = value('--dataset')
  if (
    dataset !== 'production' ||
    client.config().dataset !== dataset ||
    client.config().projectId !== 'naorcr6k'
  )
    throw new Error(
      'This reviewed content migration requires naorcr6k and explicit --dataset production',
    )
  const manifest = args.includes('--finish') ? finishManifest : contentManifest
  const contentDocumentIds = manifest.documents.map((document) => document.id)
  const plan = (row: ContentRow, allowLocked: boolean) =>
    planFigmaContentAlignment(row, allowLocked, manifest)
  const ids = contentDocumentIds.flatMap((id) => [id, `drafts.${id}`])
  const rows = await client.fetch<ContentRow[]>('*[_id in $ids]', { ids }, { perspective: 'raw' })
  if (contentDocumentIds.some((id) => rows.filter((row) => row._id === id).length !== 1))
    throw new Error('Missing or duplicate published document')
  const plans = rows
    .map((row) => plan(row, args.includes('--allow-locked')))
    .filter((plan) => plan !== null)
  console.log(JSON.stringify({ project: client.config().projectId, dataset, plans }, null, 2))
  if (!plans.length) {
    console.log('No change: all reviewed content fields already match.')
    return
  }
  if (!args.includes('--apply')) {
    console.log('Dry run only.')
    return
  }
  const backup = value('--backup')
  if (!backup || backup.startsWith('--'))
    throw new Error('Pass --backup with a new directory for the complete before snapshot')
  mkdirSync(resolve(backup), { recursive: true })
  writeFileSync(resolve(backup, 'before.json'), JSON.stringify(rows, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
  writeFileSync(resolve(backup, 'plan.json'), JSON.stringify(plans, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
  const transaction = client.transaction()
  for (const plan of plans)
    transaction.patch(plan.id, (patch) =>
      patch.ifRevisionId(plan.revision).set(plan.set).unset(plan.unset),
    )
  await transaction.commit()
  const after = await client.fetch<ContentRow[]>('*[_id in $ids]', { ids }, { perspective: 'raw' })
  writeFileSync(resolve(backup, 'after.json'), JSON.stringify(after, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
  if (after.length !== rows.length || after.some((row) => plan(row, true)))
    throw new Error('Readback did not match the reviewed patch; inspect backup before retrying')
  console.log(
    `Verified ${plans.length} document versions; locks and publication state preserved. Backup: ${backup}`,
  )
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
