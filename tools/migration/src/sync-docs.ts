/**
 * A targeted migration: exactly the committed documents you name, into the
 * brand's dataset. Runs under `sanity exec --with-user-token`.
 *
 *     pnpm --filter @o3/migration sync-docs -- 'client/*' 'page/partners-sanity'
 *     pnpm --filter @o3/migration sync-docs -- 'client/puma' --apply
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 *
 * The site is in production mode: editors and content population own the
 * datasets, and `load` recreates every unlocked pipeline-owned document it
 * finds and retires every one the corpus no longer names. Everyday changes
 * therefore ship scoped to the documents they are about (AGENTS.md → "Changing
 * a dataset"). This is that scope, made a command rather than a one-off
 * script that has to be written correctly again next time.
 *
 * Three things it deliberately does NOT do, all of which `load` does:
 *
 * - **It never retires.** A document outside the selection is not touched,
 *   whatever the corpus says about it. Deleting is what makes `load` dangerous
 *   here, so the targeted command cannot do it at all.
 * - **It never clears a draft.** An editor with an open draft keeps it; the
 *   run says so, and porting or discarding it is a decision, not a side effect.
 * - **It does not stamp provenance from the manifest.** The seeds it is for
 *   carry their own `migration` block already.
 *
 * What it keeps from `load` is everything that makes a write safe: the lock
 * rule (ADR 0003 — a `migration.locked` document is never touched, in any
 * mode), the production gate, asset resolution through `data/assets.json`, and
 * one transaction for the whole run.
 *
 * ── SAFETY ─────────────────────────────────────────────────────────────────
 *
 * **A run with no `--apply` writes nothing.** It prints the plan — what it
 * would create, what it would replace, whose draft is in the way, what is
 * locked — and exits. That is the review step; `--apply` is you agreeing with
 * it. Uploads happen either way, because an asset is content-addressed and
 * uploading the same bytes twice is a no-op.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

import { getCliClient } from 'sanity/cli'

import { brandArg } from './lib/brandArg'
import { isImageBuffer } from './lib/media'
import { ALLOW_FLAG, productionGate } from './lib/prodGate'
import { ASSET_MAP, REPO_ROOT } from './lib/paths'
import { corpusPath, readCorpus, type CorpusDoc, type CorpusEntry } from './core/read'
import { select } from './core/select'
import { LOCKED_BY_ID, LOCK_FETCH_OPTIONS, bareId, lockedIds, type LockRow } from './core/state'
import { join } from 'node:path'

const client = getCliClient({ apiVersion: '2026-07-01' })

const argv = process.argv.slice(2)
const apply = argv.includes('--apply')
const patterns = argv.filter((arg) => !arg.startsWith('-'))

/**
 * `--fields a,b` narrows a run from replacing whole documents to patching the
 * named top-level fields onto whatever the dataset already holds.
 *
 * The case it exists for is a document the corpus and an editor both write
 * into. `siteSettings` in production is the example: its `utilityNavItems`
 * comes from the corpus, while `navItems`, `defaultSeo` and `footerGroups` have
 * been edited in Studio since. A `createOrReplace` there ships one field and
 * silently reverts three.
 */
const fields = (argv.find((arg) => arg.startsWith('--fields='))?.slice('--fields='.length) ?? '')
  .split(',')
  .map((field) => field.trim())
  .filter(Boolean)

/**
 * `--force-locked` writes a document an editor has taken over (ADR 0003).
 *
 * The lock is otherwise absolute, and it stays that way for a replace: this
 * flag is only accepted alongside `--fields`, so the most it can ever do is
 * overwrite the named fields of a document somebody owns. Everything else in
 * it survives. Say on the ticket which fields, and why.
 */
const forceLocked = argv.includes('--force-locked')

// ── assets ────────────────────────────────────────────────────────────────
// The same ledger `load` keeps, read and written the same way: Sanity derives
// an asset id from the file's bytes, so an upload that has happened before
// costs a lookup and nothing else.

const assetMap: Record<string, { sha256?: string; assetId: string }> = existsSync(ASSET_MAP)
  ? JSON.parse(readFileSync(ASSET_MAP, 'utf8'))
  : {}

let assetsInDataset: Set<string> | null = null
async function existsInDataset(assetId: string): Promise<boolean> {
  if (!assetsInDataset) {
    const ids = await client.fetch<string[]>(
      '*[_type in ["sanity.imageAsset", "sanity.fileAsset"]]._id',
    )
    assetsInDataset = new Set(ids)
  }
  return assetsInDataset.has(assetId)
}

async function uploadLocalAsset(relativePath: string): Promise<string> {
  const key = `file:${relativePath}`
  if (relativePath.startsWith('/') || relativePath.includes('..')) {
    throw new Error(`_localSrc must be a repo-relative path without "..": ${relativePath}`)
  }
  const absolute = join(REPO_ROOT, relativePath)
  if (!existsSync(absolute)) throw new Error(`_localSrc file not found: ${relativePath}`)
  const buf = readFileSync(absolute)
  const known = assetMap[key]
  const unchanged = known?.sha256
    ? known.sha256 === createHash('sha1').update(buf).digest('hex')
    : Boolean(known)
  if (known && unchanged && (await existsInDataset(known.assetId))) return known.assetId

  const filename = relativePath.split('/').pop() ?? 'asset'
  const asset = await client.assets.upload(isImageBuffer(buf, filename) ? 'image' : 'file', buf, {
    filename,
  })
  assetMap[key] = { sha256: asset.sha1hash, assetId: asset._id }
  assetsInDataset?.add(asset._id)
  writeFileSync(ASSET_MAP, JSON.stringify(assetMap, null, 2) + '\n')
  console.log(`  ↑ ${filename} → ${asset._id}`)
  return asset._id
}

/**
 * Image markers resolved to real assets. `_localSrc` only: a targeted run is
 * for committed content, and the remote markers belong to the WordPress and
 * Framer trees, whose media the blanket pipeline fetches and caches.
 */
async function resolveAssets(node: unknown): Promise<unknown> {
  if (Array.isArray(node)) return Promise.all(node.map(resolveAssets))
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (typeof obj._localSrc === 'string') {
      const assetId = await uploadLocalAsset(obj._localSrc)
      const rest = Object.fromEntries(Object.entries(obj).filter(([k]) => k !== '_localSrc'))
      return { ...rest, asset: { _type: 'reference', _ref: assetId } }
    }
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) out[k] = await resolveAssets(v)
    return out
  }
  return node
}

async function main() {
  if (patterns.length === 0) {
    console.error(
      'usage: sync-docs -- <type>/<file>… [--apply]\n' +
        "       e.g. sync-docs -- 'client/*' 'page/partners-sanity' --apply",
    )
    process.exitCode = 1
    return
  }

  const { matched, empty } = select(readCorpus(), patterns)
  if (empty.length > 0) {
    console.error(`no committed document matches: ${empty.join(', ')}`)
    process.exitCode = 1
    return
  }

  const dataset = client.config().dataset
  console.log(
    `brand ${brandArg()} · target ${client.config().projectId}/${dataset} · ` +
      `${matched.length} document${matched.length === 1 ? '' : 's'}` +
      `${apply ? '' : ' · DRY RUN'}\n`,
  )
  // Both forms of every id, raw: a lock on the draft counts, and a draft that
  // exists at all is worth saying out loud because this run leaves it alone
  // and it will keep shadowing the document in Studio and in preview.
  const ids = matched.flatMap(({ document }) => [document._id, `drafts.${document._id}`])
  const rows = await client.fetch<LockRow[]>(LOCKED_BY_ID, { ids }, LOCK_FETCH_OPTIONS)
  const locked = lockedIds(rows)
  const live = new Set(rows.map((row) => row._id))
  const shadowed = new Set(
    rows.filter((row) => row._id.startsWith('drafts.')).map((r) => bareId(r._id)),
  )

  if (forceLocked && fields.length === 0) {
    console.error(
      '--force-locked is only accepted with --fields: a locked document is never replaced whole.',
    )
    process.exitCode = 1
    return
  }
  if (fields.length > 0) console.log(`  patching fields: ${fields.join(', ')}\n`)

  const writes: CorpusEntry[] = []
  for (const entry of matched) {
    const id = entry.document._id
    if (locked.has(id) && !forceLocked) {
      console.log(`  🔒 ${id} — locked, left alone  (${corpusPath(entry)})`)
      continue
    }
    const missing = fields.filter((field) => !(field in entry.document))
    if (missing.length > 0) {
      console.error(`  ✗ ${id} — the committed document has no ${missing.join(', ')}`)
      process.exitCode = 1
      return
    }
    const forced = locked.has(id) ? '  🔓 LOCKED — forced' : ''
    const verb = fields.length > 0 ? 'patch  ' : live.has(id) ? 'replace' : 'create '
    const draft = shadowed.has(id) ? '  ⚠ a draft shadows this document and is not cleared' : ''
    console.log(`  ${apply ? '✓' : '·'} ${verb} ${id}${forced}${draft}`)
    writes.push(entry)
  }

  if (!apply) {
    console.log(`\n${writes.length} would be written. Re-run with --apply to write them.`)
    return
  }

  // The gate is on the write, not on the plan. `load`'s is on the whole run
  // because a load has no harmless form; a dry run here writes nothing, and
  // refusing it would mean you could not read the production plan without
  // first arming the command that acts on it.
  const refusal = productionGate(dataset, process.argv)
  if (refusal) {
    console.error(refusal)
    console.error(
      `\n  …for this command:  pnpm --filter @o3/migration sync-docs -- <patterns> --apply ${ALLOW_FLAG}`,
    )
    process.exitCode = 1
    return
  }
  if (writes.length === 0) {
    console.log('\nnothing to write')
    return
  }

  // One transaction, for the reason `load` gives: Sanity validates a strong
  // reference against the state after the transaction, so a page and the
  // clients it references may be written in any order.
  const tx = client.transaction()
  for (const { document } of writes) {
    const resolved = (await resolveAssets(document)) as CorpusDoc
    if (fields.length === 0) {
      tx.createOrReplace(resolved)
      continue
    }
    // `set` on the named fields and nothing else. No `createIfNotExists`
    // alongside it: a patch is for a document that is already there, and
    // conjuring a `siteSettings` out of two fields would be worse than failing.
    tx.patch(resolved._id, (patch) =>
      patch.set(Object.fromEntries(fields.map((field) => [field, resolved[field]]))),
    )
  }
  await tx.commit()
  console.log(`\n${writes.length} written to ${dataset}`)
}

await main()
