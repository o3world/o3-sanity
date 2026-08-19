/**
 * Load this app's bootstrap documents into the O3XO dataset. Runs under
 * `sanity exec --with-user-token`, which is what supplies the write credential:
 *
 *   pnpm --filter @o3/o3xo seed
 *
 * A bootstrap, not a corpus. `tools/migration` is the pipeline that owns real
 * content — extract, convert, load, verify — and O3XO's second extract source
 * arrives with #217. Until it does, this app needs a homepage and a
 * `siteSettings` singleton to render at all, and this is the smallest thing that
 * writes them.
 *
 * It keeps the two guarantees that make the pipeline's loads safe to repeat
 * (ADR 0003): every document carries a **deterministic id**, so a second run
 * replaces rather than duplicates; and a document whose live copy is
 * `migration.locked` is **never touched**, so an editor can take one of these
 * out of this script's reach by ticking one box.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getCliClient } from 'sanity/cli'

const client = getCliClient({ apiVersion: '2026-07-01' })
const DOCS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'documents')

type SeedDoc = { _id: string; _type: string; [key: string]: unknown }

function readDocs(): SeedDoc[] {
  return readdirSync(DOCS_DIR)
    .filter((file) => file.endsWith('.json'))
    .sort()
    .map((file) => JSON.parse(readFileSync(join(DOCS_DIR, file), 'utf8')) as SeedDoc)
}

async function lockedIds(ids: string[]): Promise<Set<string>> {
  // Drafts as well as published: a lock ticked in a draft is still the editor
  // saying "leave this alone", and the published copy is what would be replaced.
  const locked = await client.fetch<string[]>(
    `*[_id in $ids && migration.locked == true]._id`,
    { ids: ids.flatMap((id) => [id, `drafts.${id}`]) },
    { perspective: 'raw' },
  )
  return new Set(locked.map((id) => id.replace(/^drafts\./, '')))
}

async function main() {
  const { projectId, dataset } = client.config()
  const docs = readDocs()
  const skip = await lockedIds(docs.map((doc) => doc._id))

  console.log(`seeding ${projectId}/${dataset}`)

  const tx = client.transaction()
  let written = 0
  for (const doc of docs) {
    if (skip.has(doc._id)) {
      console.log(`  · ${doc._id} (${doc._type}) — locked, left alone`)
      continue
    }
    tx.createOrReplace(doc)
    written += 1
    console.log(`  ↑ ${doc._id} (${doc._type})`)
  }

  if (written === 0) {
    console.log('nothing to write.')
    return
  }

  await tx.commit()
  console.log(`seeded ${written} document${written === 1 ? '' : 's'}.`)
}

// Not top-level `await main()`: this app is CommonJS (Next's default, and its
// config files depend on it), and `sanity exec` transpiles to the package's own
// format — where a top-level await is a build error rather than a runtime one.
main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
