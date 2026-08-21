/**
 * Load → Sanity dataset. Runs under `sanity exec --with-user-token`.
 *
 * Lock rule (ADR 0003): a document whose live copy (draft or published) has
 * migration.locked == true is never touched, in any mode. Every other
 * committed document is created-or-replaced **published**, in all three trees
 * (ADR 0016 — the translate track no longer loads drafts-only). Image nodes
 * carrying `_wpSrc` (a WordPress URL) or `_localSrc` (a repo-relative file,
 * for seeds) are resolved to uploaded assets via data/assets.json.
 *
 *   pnpm --filter @o3/migration load
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { getCliClient } from 'sanity/cli'

import { ROUTABLE_TYPES } from '@o3/sanity/constants'

import { plan } from './core/plan'
import { readCorpus } from './core/read'
import {
  LOCKED_BY_ID,
  LOCKED_BY_TYPE,
  LOCK_FETCH_OPTIONS,
  ROUTABLE_SLUGS,
  describeSlugCollision,
  slugCollisions,
  type LockRow,
  type SlugRow,
} from './core/state'
import { isImageBuffer } from './lib/media'
import { readManifest } from './lib/manifest'
import { ASSET_MAP, MEDIA_CACHE, EXTRACT_DIR, MISSING_MEDIA, REPO_ROOT } from './lib/paths'

const client = getCliClient({ apiVersion: '2026-07-01' })

type AnyDoc = { _id: string; _type: string; [k: string]: unknown }

const assetMap: Record<string, { sha256?: string; assetId: string }> = existsSync(ASSET_MAP)
  ? JSON.parse(readFileSync(ASSET_MAP, 'utf8'))
  : {}

/**
 * Which assets the **target dataset** already holds.
 *
 * `assets.json` records that a binary was uploaded, not which dataset it was
 * uploaded to — and a reference to an asset that dataset does not have fails
 * the whole transaction (`documentReferenceDoesNotExistError`). Loading into a
 * fresh dataset therefore used to be impossible: the map said "already done"
 * for 414 assets that only existed in `production`.
 *
 * Re-uploading is safe and cheap. Sanity derives an asset id from the file's
 * hash and dimensions, so the same bytes get the same id in every dataset —
 * the committed map stays correct, and `data/media-cache/` means the binaries
 * come off disk rather than back off WordPress. This is what makes ADR 0003's
 * "wipe and rebuild reproduces the dataset" true of *any* dataset.
 */
let assetsInDataset: Set<string> | null = null
async function existsInDataset(assetId: string): Promise<boolean> {
  if (!assetsInDataset) {
    const ids = await client.fetch<string[]>(
      '*[_type in ["sanity.imageAsset", "sanity.fileAsset"]]._id',
    )
    assetsInDataset = new Set(ids)
    console.log(`dataset holds ${assetsInDataset.size} assets`)
  }
  return assetsInDataset.has(assetId)
}

async function upload(key: string, filename: string, buf: Buffer): Promise<string> {
  const asset = await client.assets.upload(isImageBuffer(buf, filename) ? 'image' : 'file', buf, {
    filename,
  })
  assetMap[key] = { sha256: asset.sha1hash, assetId: asset._id }
  assetsInDataset?.add(asset._id)
  writeFileSync(ASSET_MAP, JSON.stringify(assetMap, null, 2) + '\n')
  console.log(`  ↑ asset ${filename} → ${asset._id}`)
  return asset._id
}

async function uploadAsset(url: string): Promise<string> {
  const known = assetMap[url]
  if (known && (await existsInDataset(known.assetId))) return known.assetId
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
  const known = assetMap[key]
  if (known && (await existsInDataset(known.assetId))) return known.assetId
  if (relativePath.startsWith('/') || relativePath.includes('..')) {
    throw new Error(`_localSrc must be a repo-relative path without "..": ${relativePath}`)
  }
  const absolute = join(REPO_ROOT, relativePath)
  if (!existsSync(absolute)) throw new Error(`_localSrc file not found: ${relativePath}`)
  return upload(key, relativePath.split('/').pop() ?? 'asset', readFileSync(absolute))
}

/**
 * Media that no longer exists on the WordPress server. Six years of posts
 * outlive their uploads: an image referenced in a 2019 body can 404 today.
 *
 * Committed, like `assets.json`, and for the same reason — a run has to be
 * reproducible. The first run that meets a dead URL records it and fails, so
 * the loss is reviewed in a diff; from then on it is a known, silent skip and
 * the load is green. That way "this image is gone" is a decision in git rather
 * than a network condition the pipeline rediscovers every time.
 */
const missingMedia = new Set<string>(
  existsSync(MISSING_MEDIA) ? (JSON.parse(readFileSync(MISSING_MEDIA, 'utf8')) as string[]) : [],
)
const newlyMissing = new Set<string>()

/** Every `_wpSrc` URL in a document tree. */
function mediaUrlsIn(node: unknown, found: Set<string> = new Set()): Set<string> {
  if (Array.isArray(node)) {
    for (const item of node) mediaUrlsIn(item, found)
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (typeof obj._wpSrc === 'string') found.add(obj._wpSrc)
    for (const value of Object.values(obj)) mediaUrlsIn(value, found)
  }
  return found
}

/**
 * HEAD every not-yet-uploaded URL before writing anything, so one run reports
 * every dead image instead of aborting on the first and making you discover
 * them one restart at a time.
 */
async function preflightMedia(docs: readonly AnyDoc[]) {
  const urls = [...mediaUrlsIn(docs)].filter((url) => !assetMap[url] && !missingMedia.has(url))
  if (urls.length === 0) return

  console.log(`checking ${urls.length} media URLs…`)
  const CONCURRENCY = 12
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, urls.length) }, async () => {
      while (cursor < urls.length) {
        const url = urls[cursor++]!
        try {
          const res = await fetch(url, { method: 'HEAD' })
          if (!res.ok) newlyMissing.add(url)
        } catch {
          newlyMissing.add(url)
        }
      }
    }),
  )

  for (const url of newlyMissing) missingMedia.add(url)
  if (newlyMissing.size > 0) {
    writeFileSync(MISSING_MEDIA, JSON.stringify([...missingMedia].sort(), null, 2) + '\n')
  }
}

/**
 * Recursively resolve image markers to real asset references: `_wpSrc` for a
 * WordPress URL, `_localSrc` for a repo-relative file. A node whose media is
 * gone from WordPress is dropped — an image block with no asset renders as a
 * hole, which is worse than not rendering at all.
 */
async function resolveAssets(node: unknown): Promise<unknown> {
  if (Array.isArray(node)) {
    const items = await Promise.all(node.map(resolveAssets))
    return items.filter((item) => item !== DROPPED)
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const marker = typeof obj._wpSrc === 'string' ? '_wpSrc' : '_localSrc'
    if (typeof obj[marker] === 'string') {
      const source = obj[marker] as string
      if (marker === '_wpSrc' && missingMedia.has(source)) return DROPPED
      const assetId =
        marker === '_wpSrc' ? await uploadAsset(source) : await uploadLocalAsset(source)
      const rest = Object.fromEntries(Object.entries(obj).filter(([k]) => k !== marker))
      return { ...rest, asset: { _type: 'reference', _ref: assetId } }
    }
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      const resolved = await resolveAssets(v)
      // A dropped image inside a `figure` takes the figure with it.
      if (resolved === DROPPED) {
        if (k === 'image') return DROPPED
        continue
      }
      out[k] = resolved
    }
    return out
  }
  return node
}

/** Sentinel for a node whose media no longer exists. */
const DROPPED = Symbol('dropped')

async function main() {
  // All three trees, all published (ADR 0016).
  const all = readCorpus<AnyDoc>().map((entry) => entry.document)
  if (all.length === 0) {
    console.log('nothing to load')
    return
  }

  const { runs } = readManifest()

  // Both lock reads raw (`LOCK_FETCH_OPTIONS`): the documents this run writes
  // in both their forms, and every document of the corpus's types — the
  // retirement candidates. `plan` decides; this function only fetches and
  // executes.
  const ids = all.flatMap((d) => [d._id, `drafts.${d._id}`])
  const types = [...new Set(all.map((d) => d._type as string))]
  const [current, owned] = await Promise.all([
    client.fetch<LockRow[]>(LOCKED_BY_ID, { ids }, LOCK_FETCH_OPTIONS),
    client.fetch<LockRow[]>(LOCKED_BY_TYPE, { types }, LOCK_FETCH_OPTIONS),
  ])
  // The two overlap wherever a corpus document's type is a corpus type, and
  // plan is duplicate-tolerant; both are still load-bearing — BY_ID catches a
  // locked live copy whose _type matches no corpus type.
  const rows = [...current, ...owned]

  const loadPlan = plan(all, rows, {
    runs,
    extractSource: (sourceFile) => {
      const path = join(EXTRACT_DIR, sourceFile)
      return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : undefined
    },
  })

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
  await preflightMedia(all)

  const staleDrafts = new Set(loadPlan.staleDraftClears)
  const tx = client.transaction()
  for (const doc of loadPlan.writes) {
    const resolved = (await resolveAssets(doc)) as AnyDoc
    tx.createOrReplace(resolved)
    if (staleDrafts.has(doc._id)) tx.delete(`drafts.${doc._id}`)
    console.log(`✓ ${doc._id}`)
  }
  for (const { id, draft, published } of loadPlan.retirements) {
    if (published) tx.delete(id)
    if (draft) tx.delete(`drafts.${id}`)
  }

  const loaded = loadPlan.writes.length
  const cleared = loadPlan.staleDraftClears.length
  const retiredIds = loadPlan.retirements.map((r) => r.id)
  const skipped = loadPlan.lockedSkips

  if (loaded > 0 || retiredIds.length > 0) await tx.commit()

  console.log(
    `\nloaded ${loaded} documents into ${client.config().projectId}/${client.config().dataset}`,
  )
  if (cleared > 0) {
    console.log(`cleared ${cleared} stale drafts shadowing a published document`)
  }
  if (retiredIds.length > 0) {
    console.log(`retired ${retiredIds.length} no longer in the corpus: ${retiredIds.join(', ')}`)
  }
  if (skipped.length > 0) {
    console.log(`skipped ${skipped.length} locked: ${skipped.join(', ')}`)
  }

  if (newlyMissing.size > 0) {
    console.error(
      `\nMISSING MEDIA (${newlyMissing.size}) — gone from WordPress, dropped from the loaded documents:`,
    )
    for (const url of [...newlyMissing].sort()) console.error(`  ${url}`)
    console.error(
      `Recorded in ${MISSING_MEDIA}; review the diff, then re-run — they are a known skip from now on.`,
    )
    process.exitCode = 1
  } else if (missingMedia.size > 0) {
    console.log(`skipped ${missingMedia.size} known-missing media (data/missing-media.json)`)
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
  const rows = await client.fetch<SlugRow[]>(ROUTABLE_SLUGS, { types: [...ROUTABLE_TYPES] })
  const collisions = slugCollisions(rows)
  if (collisions.length === 0) return

  console.error(`\nSLUG COLLISIONS (${collisions.length}) — these URLs resolve unpredictably:`)
  for (const collision of collisions) {
    console.error(`  ${describeSlugCollision(collision)}`)
  }
  console.error('Delete the document that is not committed under data/, then re-run.')
  process.exitCode = 1
}

await main()
