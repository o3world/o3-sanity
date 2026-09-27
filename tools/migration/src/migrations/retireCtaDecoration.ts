import { writeFileSync } from 'node:fs'
import { getCliClient } from 'sanity/cli'
import { planCtaDecorationRetirement, type CtaDecorationRow } from './retireCtaDecorationPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })
async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const value = (flag: string) => (args.includes(flag) ? args[args.indexOf(flag) + 1] : undefined)
  const dataset = value('--dataset')
  if (
    !dataset ||
    !['production', 'development'].includes(dataset) ||
    dataset !== client.config().dataset ||
    client.config().projectId !== 'naorcr6k'
  )
    throw new Error('Pass --dataset matching the O3 production or development dataset explicitly')
  const rows = await client.fetch<CtaDecorationRow[]>(
    '*[_type in ["page","collectionIndex","caseStudy"] && (count(sections[_type=="ctaSection" && defined(decoration)]) > 0 || count(sectionsAbove[_type=="ctaSection" && defined(decoration)]) > 0 || count(sectionsBelow[_type=="ctaSection" && defined(decoration)]) > 0 || count(story[_type=="ctaSection" && defined(decoration)]) > 0)]',
    {},
    { perspective: 'raw' },
  )
  const plans = rows.map(planCtaDecorationRetirement).filter((plan) => plan !== null)
  console.log(`${client.config().projectId}/${dataset}`)
  console.log(JSON.stringify(plans, null, 2))
  if (!plans.length) {
    console.log('No retired CTA decorations remain.')
    return
  }
  if (!args.includes('--apply')) {
    console.log('Dry run only.')
    return
  }
  const backup = value('--backup')
  if (!backup || backup.startsWith('--'))
    throw new Error('Pass a new --backup path before applying')
  writeFileSync(backup, JSON.stringify(rows, null, 2), { flag: 'wx', mode: 0o600 })
  const transaction = client.transaction()
  for (const plan of plans)
    transaction.patch(plan.id, (patch) => patch.ifRevisionId(plan.revision).unset(plan.unset))
  await transaction.commit()
  console.log(
    `Removed retired CTA decoration fields in ${plans.length} versions; no drafts published.`,
  )
}
main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
