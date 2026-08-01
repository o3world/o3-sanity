/**
 * Load → Sanity dataset. Runs under `sanity exec --with-user-token`.
 *
 * Lock rule (ADR 0003): a document whose live copy (draft or published) has
 * migration.locked == true is never touched, in any mode. Unlocked docs are
 * created-or-replaced: converted + seed docs as PUBLISHED, translated docs as
 * DRAFTS only. Image nodes carrying `_wpSrc` (a WordPress URL) or `_localSrc`
 * (a repo-relative file, for seeds) are resolved to uploaded assets via
 * data/assets.json.
 *
 *   pnpm --filter @o3/migration load
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { getCliClient } from 'sanity/cli'

import { ROUTABLE_TYPES } from '@o3/sanity/constants'

import {
  ASSET_MAP,
  CONVERTED_DIR,
  MEDIA_CACHE,
  REPO_ROOT,
  SEED_DIR,
  TRANSLATED_DIR,
} from './lib/paths'

const client = getCliClient({ apiVersion: '2026-07-01' })

type AnyDoc = { _id: string; _type: string; [k: string]: unknown }

function readTree(root: string): AnyDoc[] {
  if (!existsSync(root)) return []
  const docs: AnyDoc[] = []
  for (const type of readdirSync(root)) {
    const dir = join(root, type)
    for (const f of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      docs.push(JSON.parse(readFileSync(join(dir, f), 'utf8')))
    }
  }
  return docs
}

const assetMap: Record<string, { sha256?: string; assetId: string }> = existsSync(ASSET_MAP)
  ? JSON.parse(readFileSync(ASSET_MAP, 'utf8'))
  : {}

async function upload(key: string, filename: string, buf: Buffer): Promise<string> {
  const isImage = /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(filename)
  const asset = await client.assets.upload(isImage ? 'image' : 'file', buf, { filename })
  assetMap[key] = { sha256: asset.sha1hash, assetId: asset._id }
  writeFileSync(ASSET_MAP, JSON.stringify(assetMap, null, 2) + '\n')
  console.log(`  ↑ asset ${filename} → ${asset._id}`)
  return asset._id
}

async function uploadAsset(url: string): Promise<string> {
  if (assetMap[url]) return assetMap[url].assetId
  mkdirSync(MEDIA_CACHE, { recursive: true })
  const cacheFile = join(MEDIA_CACHE, encodeURIComponent(url))
  let buf: Buffer
  if (existsSync(cacheFile)) {
    buf = readFileSync(cacheFile)
  } else {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`)
    buf = Buffer.from(await res.arrayBuffer())
    writeFileSync(cacheFile, buf)
  }
  const filename = decodeURIComponent(url.split('/').pop() ?? 'asset')
  return upload(url, filename, buf)
}

/**
 * A seed's image, read from a repo path instead of fetched (#20). Seeds are
 * greenfield content, so their imagery comes from `prototype/` — the design
 * source of truth — not from WordPress. Keyed `file:<path>` in
 * `data/assets.json` so a repo file and a URL can never collide.
 */
async function uploadLocalAsset(relativePath: string): Promise<string> {
  const key = `file:${relativePath}`
  if (assetMap[key]) return assetMap[key].assetId
  if (relativePath.startsWith('/') || relativePath.includes('..')) {
    throw new Error(`_localSrc must be a repo-relative path without "..": ${relativePath}`)
  }
  const absolute = join(REPO_ROOT, relativePath)
  if (!existsSync(absolute)) throw new Error(`_localSrc file not found: ${relativePath}`)
  return upload(key, relativePath.split('/').pop() ?? 'asset', readFileSync(absolute))
}

/**
 * Recursively resolve image markers to real asset references: `_wpSrc` for a
 * WordPress URL, `_localSrc` for a repo-relative file.
 */
async function resolveAssets(node: unknown): Promise<unknown> {
  if (Array.isArray(node)) return Promise.all(node.map(resolveAssets))
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const marker = typeof obj._wpSrc === 'string' ? '_wpSrc' : '_localSrc'
    if (typeof obj[marker] === 'string') {
      const source = obj[marker] as string
      const assetId =
        marker === '_wpSrc' ? await uploadAsset(source) : await uploadLocalAsset(source)
      const rest = Object.fromEntries(Object.entries(obj).filter(([k]) => k !== marker))
      return { ...rest, asset: { _type: 'reference', _ref: assetId } }
    }
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) out[k] = await resolveAssets(v)
    return out
  }
  return node
}

async function main() {
  const published = [...readTree(CONVERTED_DIR), ...readTree(SEED_DIR)]
  const drafts = readTree(TRANSLATED_DIR)
  const all = [...published, ...drafts]
  if (all.length === 0) {
    console.log('nothing to load')
    return
  }

  const ids = all.flatMap((d) => [d._id, `drafts.${d._id}`])
  const locked = new Set<string>(
    (
      await client.fetch<{ _id: string; locked: boolean | null }[]>(
        '*[_id in $ids]{_id, "locked": migration.locked}',
        { ids },
      )
    )
      .filter((d) => d.locked === true)
      .map((d) => d._id.replace(/^drafts\./, '')),
  )

  // One transaction for the whole load, for two reasons. Sanity validates a
  // strong reference against the state AFTER the transaction, so documents
  // may reference each other in any order — writing them one at a time made
  // load order load-bearing, and it silently was: `caseStudy` sorts before
  // `client` and `industry`, so the first seeded case study failed on a
  // reference to an industry that had not been written yet. And a failed load
  // now leaves the dataset untouched rather than half-written, which is what
  // "wipe and rebuild reproduces the dataset" (ADR 0003) actually requires.
  //
  // Assets upload outside the transaction — they are content-addressed and
  // re-uploading is a no-op, so a failed commit costs nothing but time.
  const tx = client.transaction()
  let loaded = 0
  const skipped: string[] = []
  for (const doc of all) {
    if (locked.has(doc._id)) {
      skipped.push(doc._id)
      continue
    }
    const isDraftTrack = drafts.includes(doc)
    const resolved = (await resolveAssets(doc)) as AnyDoc
    tx.createOrReplace(isDraftTrack ? { ...resolved, _id: `drafts.${doc._id}` } : resolved)
    console.log(`✓ ${isDraftTrack ? 'draft ' : ''}${doc._id}`)
    loaded++
  }

  if (loaded > 0) await tx.commit()

  console.log(
    `\nloaded ${loaded} documents into ${client.config().projectId}/${client.config().dataset}`,
  )
  if (skipped.length > 0) {
    console.log(`skipped ${skipped.length} locked: ${skipped.join(', ')}`)
  }

  await reportSlugCollisions()
}

/**
 * Routes resolve a document with `*[_type == $type && slug.current == $slug][0]`,
 * so two documents claiming one slug make the served page a coin flip. The
 * committed corpus is checked against itself in `seed.test.ts`, but that
 * cannot see what is already IN the dataset — and a document the pipeline
 * does not own is exactly what bit the homepage: a leftover scaffolding
 * `page-home` shared the seed's `index` slug and won the toss about half the
 * time, so `/` served two sections instead of eight with nothing failing.
 *
 * Reported rather than thrown: by the time this runs the load has committed,
 * and resolving a collision means deciding which document to delete — an
 * editorial call, not something a loader should make.
 */
async function reportSlugCollisions() {
  const rows = await client.fetch<{ _id: string; _type: string; slug: string | null }[]>(
    `*[_type in $types && defined(slug.current) && !(_id in path("drafts.**"))]{_id, _type, "slug": slug.current}`,
    { types: [...ROUTABLE_TYPES] },
  )

  const byKey = new Map<string, string[]>()
  for (const row of rows) {
    const key = `${row._type}:${row.slug}`
    byKey.set(key, [...(byKey.get(key) ?? []), row._id])
  }

  const collisions = [...byKey].filter(([, ids]) => ids.length > 1)
  if (collisions.length === 0) return

  console.error(`\nSLUG COLLISIONS (${collisions.length}) — these URLs resolve unpredictably:`)
  for (const [key, ids] of collisions) {
    console.error(`  ${key} → ${ids.join(', ')}`)
  }
  console.error('Delete the document that is not committed under data/, then re-run.')
  process.exitCode = 1
}

await main()
