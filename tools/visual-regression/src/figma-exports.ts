/**
 * The IO half of the frame-export cache (#337): read each brand's
 * `figma:sync` baseline, list what `.vr/figma/` already holds, ask the images
 * API to draw whatever the plan says is missing, and write the bytes.
 *
 * The client is `@o3/figma-sync`'s, not a second one — same token, same 429
 * retry, same `/images` semantics, including the one that matters here: Figma
 * answers `null` for a node it will not export rather than failing the call,
 * so a deleted frame arrives as a named absence and is reported (spec #326 →
 * the gate fails on a node missing from the file, which `ledger.ts` reads as
 * the `orphaned` red).
 *
 * The token is read only when there is something to fetch, so a run with no
 * design change needs neither a key nor a network.
 */
import fs from 'node:fs'
import path from 'node:path'

import { readFigmaToken } from '@o3/figma-sync/env'
import { createFigmaClient, type FigmaClient } from '@o3/figma-sync/figma-api'
import { PNG } from 'pngjs'

import {
  exportFile,
  parseExportFile,
  planExports,
  type BrandBaseline,
  type CachedExport,
  type ExportOutcome,
  type ExportPlan,
  type ExportRequest,
  type MissingNode,
} from './export-cache'
import { REPO_ROOT } from './figma-inventory'
import { frameKey, type FrameExport } from './frame-score'
import type { PairingRow } from './pairing'
import { BRANDS, type Brand } from './storybook'

/** `tools/figma-sync/data/` — that package's committed baselines. */
const BASELINE: Record<Brand, string> = {
  o3: 'tools/figma-sync/data/baseline.json',
  o3xo: 'tools/figma-sync/data/baseline-o3xo.json',
}

/**
 * `vr` captures at `deviceScaleFactor: 1` with `scale: 'css'` (`capture.ts`),
 * and the frames a story pairs against are drawn at the capture widths — 402
 * and 1440 — so one design pixel is one capture pixel at scale 1. Anything
 * else would put a resample between the two sides of every comparison.
 */
const EXPORT_FORMAT = 'png' as const
const EXPORT_SCALE = 1

/**
 * The export directory carries what its files were drawn *with*, the way
 * `captureKey` names the screenshot cache. Format and scale are not in the key
 * — the key is (node, baseline hash), as the spec says — so without this a
 * changed scale would be served out of a cache written under the old one.
 */
const DRAWN_WITH = `${EXPORT_FORMAT}-x${EXPORT_SCALE}`

/** How many node ids go in one `/images` call. Figma draws each one. */
const IMAGE_BATCH_SIZE = 10

/** Where the exports live: gitignored under `.vr/`, like every other artifact. */
export function exportDir(root: string): string {
  return path.join(root, '.vr', 'figma', DRAWN_WITH)
}

interface BaselineFile {
  readonly fileKey: string
  readonly version: string
  readonly hashes: Readonly<Record<string, string>>
}

/** A brand with no baseline file yet is `hashes: null`, not an error. */
export function readBaselines(brands: readonly Brand[] = BRANDS): BrandBaseline[] {
  return brands.map((brand) => {
    const file = path.join(REPO_ROOT, BASELINE[brand])
    if (!fs.existsSync(file)) return { brand, fileKey: '', version: '', hashes: null }
    const baseline = JSON.parse(fs.readFileSync(file, 'utf8')) as BaselineFile
    return {
      brand,
      fileKey: baseline.fileKey,
      version: baseline.version,
      hashes: baseline.hashes,
    }
  })
}

/** Every export on disk, read back off its filename. The cache has no index. */
export function readCachedExports(dir: string, brands: readonly Brand[] = BRANDS): CachedExport[] {
  const cached: CachedExport[] = []
  for (const brand of brands) {
    const brandDir = path.join(dir, brand)
    if (!fs.existsSync(brandDir)) continue
    for (const name of fs.readdirSync(brandDir)) {
      const entry = parseExportFile(brand, name)
      if (entry) cached.push(entry)
    }
  }
  return cached
}

/**
 * The exports this run actually has, sized off the PNG headers — the input the
 * scoring plan takes its capture widths from (#338).
 *
 * Fresh and just-fetched alike, minus whatever the file would not draw. The
 * size is read rather than assumed: the export is the authority on the width
 * the story is captured at, and only the file says what that is.
 */
export function readFrameExports(
  dir: string,
  plan: ExportPlan,
  outcome: ExportOutcome,
  brand: Brand,
): Map<string, FrameExport> {
  const missing = new Set(outcome.missing.map((node) => `${node.brand}/${node.nodeId}`))
  const exports = new Map<string, FrameExport>()
  for (const request of [...plan.fresh, ...plan.fetch]) {
    if (request.brand !== brand) continue
    if (missing.has(`${request.brand}/${request.nodeId}`)) continue
    const file = path.join(dir, request.file)
    if (!fs.existsSync(file)) continue
    const image = PNG.sync.read(fs.readFileSync(file))
    exports.set(frameKey(request.brand, request.nodeId), {
      brand: request.brand,
      nodeId: request.nodeId,
      file,
      width: image.width,
      height: image.height,
    })
  }
  return exports
}

export function planFrameExports(
  pairings: readonly PairingRow[],
  brands: readonly Brand[],
  dir: string,
): ExportPlan {
  return planExports(pairings, readBaselines(brands), readCachedExports(dir, brands))
}

/**
 * One `/images` batch, named down to the node when it fails.
 *
 * A bad id makes the whole call fail, so a failed batch of several is split
 * and re-asked one at a time: the point is that the error names the node the
 * next reader has to look at. A rate limit is not split — the client has
 * already waited it out four times, and asking ten more times would spend the
 * quota proving the same thing.
 */
async function renderUrls(
  client: FigmaClient,
  fileKey: string,
  requests: readonly ExportRequest[],
): Promise<Map<string, string | null>> {
  try {
    return await client.getRenderUrls(
      fileKey,
      requests.map((request) => request.nodeId),
      { format: EXPORT_FORMAT, scale: EXPORT_SCALE },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (requests.length === 1 || message.includes('429')) {
      const nodes = requests.map((request) => request.nodeId).join(', ')
      throw new Error(`Figma refused to draw ${nodes}\n${message}`)
    }
    const urls = new Map<string, string | null>()
    for (const request of requests) {
      for (const [nodeId, url] of await renderUrls(client, fileKey, [request])) {
        urls.set(nodeId, url)
      }
    }
    return urls
  }
}

export interface EnsureOptions {
  readonly dir: string
  readonly plan: ExportPlan
  readonly client?: FigmaClient
  readonly onProgress?: (done: number, total: number) => void
}

/**
 * Make the cache match the plan: sweep what nothing claims, fetch what is
 * missing, write each export the moment its bytes arrive.
 *
 * Written one at a time on purpose. A run that dies halfway — a quota, a
 * dropped link — leaves every export it did get, and the next run re-plans
 * against the directory and asks only for the rest.
 */
export async function ensureExports({
  dir,
  plan,
  client,
  onProgress,
}: EnsureOptions): Promise<ExportOutcome> {
  for (const entry of plan.stale) {
    fs.rmSync(path.join(dir, exportFile(entry.brand, entry.nodeId, entry.hash)), { force: true })
  }
  if (plan.fetch.length === 0) return { fetched: 0, missing: [] }

  const figma = client ?? createFigmaClient(readFigmaToken())
  const missing: MissingNode[] = []
  let fetched = 0

  // Grouped by file: one call cannot span two design files.
  const byFile = new Map<string, ExportRequest[]>()
  for (const request of plan.fetch) {
    byFile.set(request.fileKey, [...(byFile.get(request.fileKey) ?? []), request])
  }

  for (const [fileKey, requests] of byFile) {
    for (let i = 0; i < requests.length; i += IMAGE_BATCH_SIZE) {
      const batch = requests.slice(i, i + IMAGE_BATCH_SIZE)
      const urls = await renderUrls(figma, fileKey, batch)
      for (const request of batch) {
        const url = urls.get(request.nodeId) ?? null
        if (!url) {
          missing.push({
            brand: request.brand,
            nodeId: request.nodeId,
            stories: request.stories,
          })
          continue
        }
        const bytes = await figma.downloadBinary(url).catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error)
          throw new Error(`the export of ${request.nodeId} could not be downloaded\n${message}`)
        })
        const file = path.join(dir, request.file)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        // Written aside and renamed, so a run killed mid-write cannot leave a
        // half PNG under a key the next run reads as a hit.
        fs.writeFileSync(`${file}.tmp`, bytes)
        fs.renameSync(`${file}.tmp`, file)
        fetched += 1
        onProgress?.(fetched + missing.length, plan.fetch.length)
      }
    }
  }

  return { fetched, missing }
}
