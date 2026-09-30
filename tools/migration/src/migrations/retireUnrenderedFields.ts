/**
 * Targeted migration — unset two fields the schema no longer has: a
 * `quoteSection`'s `eyebrow` and a `featureGridSection` feature's `icon`.
 * Neither renders, so removing them changes nothing a visitor sees.
 *
 * It reads, raw, every published document and draft whose type hosts either
 * block (release versions are left alone), and gives each one that holds a
 * value one `unset` patch guarded by the revision it was read at. An edit
 * made between the read and the write fails the transaction instead of being
 * overwritten. A draft is patched as a draft; nothing is published. A rerun
 * finds nothing and writes nothing.
 *
 * `migration.locked` does not apply: this removes values the document already
 * holds and brings in nothing from outside it (AGENTS.md → Changing a dataset).
 *
 *   pnpm --filter @o3/migration retire-unrendered-fields -- --dataset development           # report only
 *   pnpm --filter @o3/migration retire-unrendered-fields -- --dataset development --apply   # write
 *
 * `--dataset` is required every time and must name the configured dataset.
 */
import { getCliClient } from 'sanity/cli'
import { BLOCK_ARRAYS } from '@o3/sanity/schemas/registry'

import { planRetireUnrenderedFields, type RetireRow } from './retireUnrenderedFieldsPlan'

const client = getCliClient({ apiVersion: '2026-07-01' })

const RETIRED_ON = ['quoteSection', 'featureGridSection']

/** `page.sections` → `page`: every document type whose block arrays take either block. */
const HOST_TYPES = [
  ...new Set(
    Object.entries(BLOCK_ARRAYS)
      .filter(([, members]) => (members as readonly string[]).some((t) => RETIRED_ON.includes(t)))
      .map(([address]) => address.split('.')[0]),
  ),
]

const QUERY = /* groq */ `*[_type in $types && !(_id in path("versions.**"))] | order(_id asc)`

async function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--')
  const apply = args.includes('--apply')
  const dataset = client.config().dataset
  const named = args.includes('--dataset') ? args[args.indexOf('--dataset') + 1] : undefined
  if (!named || named !== dataset)
    throw new Error(
      `refusing to touch "${dataset}" — pass --dataset ${dataset} to say so out loud.`,
    )

  const rows = await client.fetch<RetireRow[]>(QUERY, { types: HOST_TYPES }, { perspective: 'raw' })
  const plans = rows.map(planRetireUnrenderedFields).filter((plan) => plan !== null)
  console.log(
    `${client.config().projectId}/${dataset} — ${rows.length} ${HOST_TYPES.join('/')} document(s) read\n`,
  )

  for (const plan of plans)
    for (const [path, value] of Object.entries(plan.removed))
      console.log(`  ${apply ? 'unset' : 'would'}  ${plan.id}  ${path}  ${JSON.stringify(value)}`)

  if (!apply) {
    console.log(`\n${plans.length} document(s) would change. Re-run with --apply.`)
    return
  }
  if (plans.length === 0) {
    console.log('\nnothing to do')
    return
  }

  // One transaction, each patch pinned to the revision it was planned from.
  const tx = plans.reduce(
    (acc, plan) =>
      acc.patch(plan.id, (patch) => patch.ifRevisionId(plan.revision).unset(plan.unset)),
    client.transaction(),
  )
  await tx.commit()
  console.log(`\nwrote ${plans.length} document(s) to ${dataset}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
