/**
 * Targeted migration — delete every `development` document that `production`
 * does not have.
 *
 * `pnpm dataset:sync` imports with `--replace`, which overwrites the documents
 * the two datasets share and **leaves development-only documents alone**. That
 * is the right default for a scratch dataset and the wrong one for a rehearsal:
 * what you see on development has to be what you will see on production after
 * an op runs, and 500 documents production has never heard of make that false.
 *
 * So this is the other half of a sync. Run the two together and development is
 * production, exactly — then run the op you are rehearsing, and what you are
 * looking at is what production will look like.
 *
 *   pnpm dataset:sync                                      # production → development
 *   pnpm --filter @o3/migration dev-mirrors-prod           # report only
 *   pnpm --filter @o3/migration dev-mirrors-prod -- --apply
 *
 * **It deletes, so it only ever points at `development`** — not by default,
 * but by refusal: there is no flag that aims it anywhere else. Production is
 * read here and never written.
 *
 * **Back development up first.** A development-only document — a brief, an
 * experiment, a draft nobody published — exists nowhere else, and this is what
 * removes it:
 *
 *   cd tools/migration && pnpm exec sanity dataset export development <path>.tar.gz
 *
 * Deletion runs in two passes, content before assets: Sanity refuses to delete
 * an asset a document still references, and the documents holding these
 * references are themselves in the delete set. Anything still referenced after
 * the first pass fails the transaction loudly rather than being forced —
 * a production document referencing a development-only one would mean the sync
 * did not do what this script assumes, and that is worth stopping for.
 */
import { getCliClient } from 'sanity/cli'

import { developmentOnly } from '../lib/developmentOnly'

const client = getCliClient({ apiVersion: '2026-07-01' })

const argv = process.argv.slice(2)
const apply = argv.includes('--apply')

/** Sanity caps a transaction's size; deletes go out in batches of this many. */
const BATCH = 100

const ASSET_TYPES = new Set(['sanity.imageAsset', 'sanity.fileAsset'])

type Row = { _id: string; _type: string; title?: string; slug?: string }

const ALL = /* groq */ `*[!(_id in path("_.**"))]{_id, _type, "title": coalesce(title, name, originalFilename), "slug": slug.current}`

function describe(row: Row) {
  const name = row.title ?? row.slug ?? row._id
  return `${row._type.padEnd(20)} ${name}`
}

async function main() {
  const refusal = developmentOnly(client.config().dataset)
  if (refusal) throw new Error(refusal)

  const production = client.withConfig({ dataset: 'production' })
  const [devRows, prodRows] = await Promise.all([
    client.fetch<Row[]>(ALL),
    production.fetch<Row[]>(ALL),
  ])

  const inProduction = new Set(prodRows.map((row) => row._id))
  const extra = devRows.filter((row) => !inProduction.has(row._id))

  console.log(
    `${client.config().projectId} — development ${devRows.length} · production ${prodRows.length}\n`,
  )

  if (extra.length === 0) {
    console.log('development already holds nothing production does not. Nothing to do.')
    return
  }

  const assets = extra.filter((row) => ASSET_TYPES.has(row._type))
  const content = extra.filter((row) => !ASSET_TYPES.has(row._type))

  const byType = new Map<string, Row[]>()
  for (const row of content) byType.set(row._type, [...(byType.get(row._type) ?? []), row])

  console.log(`${extra.length} document(s) in development that production does not have:\n`)
  for (const [type, rows] of [...byType].sort()) {
    console.log(`  ${type} (${rows.length})`)
    for (const row of rows.slice(0, 8)) console.log(`      ${row.title ?? row.slug ?? row._id}`)
    if (rows.length > 8) console.log(`      …and ${rows.length - 8} more`)
  }
  if (assets.length) console.log(`\n  assets (${assets.length}) — deleted after the content`)

  if (!apply) {
    console.log(`\nRe-run with --apply to delete them. Back development up first:`)
    console.log(
      `  cd tools/migration && pnpm exec sanity dataset export development ~/dev-backup.tar.gz`,
    )
    return
  }

  // Content first, then assets: an asset a surviving document still references
  // cannot be deleted, and the documents referencing these are in this set.
  for (const [label, rows] of [
    ['content', content],
    ['assets', assets],
  ] as const) {
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH)
      const tx = batch.reduce((acc, row) => acc.delete(row._id), client.transaction())
      // `visibility: 'sync'` so the read-back below means something. Under the
      // default the deletes land before the query can see them and the script
      // reports its own successful work as still-present.
      await tx.commit({ visibility: 'sync' })
      console.log(`  deleted ${label} ${i + batch.length}/${rows.length}`)
    }
  }

  const left = (await client.fetch<Row[]>(ALL)).filter((row) => !inProduction.has(row._id))
  console.log(`\ndevelopment now holds ${left.length} document(s) production does not.`)
  if (left.length) for (const row of left.slice(0, 20)) console.log(`  left  ${describe(row)}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
