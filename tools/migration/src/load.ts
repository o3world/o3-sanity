/**
 * Load → Sanity dataset. Runs under `sanity exec --with-user-token`.
 *
 * Lock rule (ADR 0003): a document whose live copy (draft or published) has
 * migration.locked == true is never touched, in any mode. Unlocked docs are
 * created-or-replaced: converted + seed docs as PUBLISHED, translated docs as
 * DRAFTS only. Image nodes carrying `_wpSrc` are resolved to uploaded assets
 * via data/assets.json (source URL → asset id).
 *
 *   pnpm --filter @o3/migration load
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { getCliClient } from 'sanity/cli'

import { ASSET_MAP, CONVERTED_DIR, MEDIA_CACHE, SEED_DIR, TRANSLATED_DIR } from './lib/paths'

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
  const isImage = /\.(jpe?g|png|gif|webp|avif|svg)$/i.test(filename)
  const asset = await client.assets.upload(isImage ? 'image' : 'file', buf, { filename })
  assetMap[url] = { sha256: asset.sha1hash, assetId: asset._id }
  writeFileSync(ASSET_MAP, JSON.stringify(assetMap, null, 2) + '\n')
  console.log(`  ↑ asset ${filename} → ${asset._id}`)
  return asset._id
}

/** Recursively resolve `_wpSrc` image markers to real asset references. */
async function resolveAssets(node: unknown): Promise<unknown> {
  if (Array.isArray(node)) return Promise.all(node.map(resolveAssets))
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (typeof obj._wpSrc === 'string') {
      const assetId = await uploadAsset(obj._wpSrc)
      const rest = Object.fromEntries(Object.entries(obj).filter(([k]) => k !== '_wpSrc'))
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

  let loaded = 0
  const skipped: string[] = []
  for (const doc of all) {
    if (locked.has(doc._id)) {
      skipped.push(doc._id)
      continue
    }
    const isDraftTrack = drafts.includes(doc)
    const resolved = (await resolveAssets(doc)) as AnyDoc
    const target = isDraftTrack ? { ...resolved, _id: `drafts.${doc._id}` } : resolved
    await client.createOrReplace(target)
    console.log(`✓ ${isDraftTrack ? 'draft ' : ''}${doc._id}`)
    loaded++
  }

  console.log(
    `\nloaded ${loaded} documents into ${client.config().projectId}/${client.config().dataset}`,
  )
  if (skipped.length > 0) {
    console.log(`skipped ${skipped.length} locked: ${skipped.join(', ')}`)
  }
}

await main()
