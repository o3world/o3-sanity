/**
 * Drift → which committed documents production has moved past. Runs under
 * `sanity exec --with-user-token`, read-only unless told otherwise.
 *
 * Editors author in `production`, so a pipeline-owned document can carry
 * edits the committed corpus knows nothing about. A `sync-docs` run of that
 * document would revert them. This command names every such document:
 *
 *   pnpm dataset:drift                                # report, exit 1 on drift
 *   pnpm --filter @o3/migration drift -- --lock      # stamp migration.locked on each
 *
 * `--lock` is the protection ADR 0003 defines: `sync-docs` never replaces a
 * locked document. Locking is how an editor's version becomes the version;
 * porting their edit back into the seed JSON and unlocking is how the corpus
 * becomes the version again.
 *
 * The comparison itself is `core/drift.ts`; this fetches, prints, and locks.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { getCliClient } from 'sanity/cli'

import { driftBetween, type AnyDoc, type AssetMap } from './core/drift'
import { plan } from './core/plan'
import { readCorpus } from './core/read'
import { LOCKED_BY_ID, LOCK_FETCH_OPTIONS, type LockRow } from './core/state'
import { readManifest } from './lib/manifest'
import { ASSET_MAP, EXTRACT_DIR, MISSING_MEDIA } from './lib/paths'

const client = getCliClient({ apiVersion: '2026-07-01' })

async function main() {
  const all = readCorpus<AnyDoc>().map((entry) => entry.document)
  console.log(`target ${client.config().projectId}/${client.config().dataset}\n`)
  if (all.length === 0) {
    console.log('nothing committed, nothing to drift')
    return
  }

  // Both forms of every committed id, so a lock on either copy counts —
  // locked documents are already safe and are counted, not compared.
  const ids = all.flatMap((d) => [d._id, `drafts.${d._id}`])
  const locks = await client.fetch<LockRow[]>(LOCKED_BY_ID, { ids }, LOCK_FETCH_OPTIONS)
  const { runs } = readManifest()
  const corpusPlan = plan(all, locks, {
    runs,
    extractSource: (sourceFile) => {
      const path = join(EXTRACT_DIR, sourceFile)
      return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined
    },
  })

  const writeIds = corpusPlan.writes.flatMap((d) => [d._id, `drafts.${d._id}`])
  const live = await client.fetch<AnyDoc[]>('*[_id in $ids]', { ids: writeIds }, LOCK_FETCH_OPTIONS)

  const assets: AssetMap = existsSync(ASSET_MAP) ? JSON.parse(readFileSync(ASSET_MAP, 'utf8')) : {}
  const missing = new Set<string>(
    existsSync(MISSING_MEDIA) ? (JSON.parse(readFileSync(MISSING_MEDIA, 'utf8')) as string[]) : [],
  )

  const findings = driftBetween(corpusPlan.writes, live, assets, missing)

  if (corpusPlan.lockedSkips.length > 0) {
    console.log(`locked (sync-docs will not replace them): ${corpusPlan.lockedSkips.length}`)
  }
  if (findings.length === 0) {
    console.log(`no drift — ${corpusPlan.writes.length} unlocked documents match the corpus`)
    return
  }

  console.log(
    `DRIFT (${findings.length}) — production differs from data/; a sync-docs run would revert these edits:`,
  )
  for (const { id, fields, draft } of findings) {
    const notes = [
      fields.length > 0 ? `published differs: ${fields.join(', ')}` : null,
      draft ? 'has an open draft' : null,
    ].filter(Boolean)
    console.log(`  ${id} — ${notes.join('; ')}`)
  }

  if (process.argv.includes('--lock')) {
    // ADR 0003 locks the pair from either side, so the flag goes on whichever
    // copy actually exists — the published one when there is one, the draft
    // when the edit only lives there.
    const hasPublished = new Set(live.filter((d) => !d._id.startsWith('drafts.')).map((d) => d._id))
    const tx = client.transaction()
    for (const { id } of findings) {
      tx.patch(hasPublished.has(id) ? id : `drafts.${id}`, (patch) =>
        patch.set({ 'migration.locked': true }),
      )
    }
    await tx.commit()
    console.log(`\nlocked ${findings.length} documents — sync-docs will not replace them`)
    console.log(
      'To let sync-docs write one again: port the edit into data/, then unset migration.locked.',
    )
    return
  }

  console.log('\nProtect them:  pnpm --filter @o3/migration drift -- --lock')
  console.log('Or port the edits back into tools/migration/data/ so the corpus catches up.')
  process.exitCode = 1
}

await main()
