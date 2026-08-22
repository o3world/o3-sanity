import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ASSET_DIR } from './asset-manifest'
import { brandFiles, DEFAULT_BRAND, type Brand } from './brands'

import type { AssetManifest, Baseline, Report, TrackedManifest } from './types'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'data')
/** The monorepo root — the manifest's `codeComponent` paths are relative to it. */
export const REPO_ROOT = join(ROOT, '..', '..')

/** Where `pnpm env:pull` puts the dev environment, FIGMA_API_KEY included. */
export const WEB_ENV_LOCAL = join(REPO_ROOT, 'apps', 'web', '.env.local')

/** The four (or three) committed files a brand's run reads and writes. */
export function dataPaths(brand: Brand = DEFAULT_BRAND) {
  const files = brandFiles(brand)
  return {
    trackedNodes: join(DATA, files.trackedNodes),
    assetManifest: files.assetManifest ? join(DATA, files.assetManifest) : null,
    baseline: join(DATA, files.baseline),
    reportJson: join(DATA, files.reportJson),
    reportMd: join(DATA, files.reportMd),
  }
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}

export function readManifest(brand: Brand = DEFAULT_BRAND): TrackedManifest {
  return readJson<TrackedManifest>(dataPaths(brand).trackedNodes)
}

/**
 * A brand with no asset manifest gets an empty one keyed to its own file, so
 * the asset stage plans nothing, calls nothing and writes nothing — the same
 * path an O3 run takes when no source node moved.
 */
export function readAssetManifest(brand: Brand = DEFAULT_BRAND): AssetManifest {
  const path = dataPaths(brand).assetManifest
  if (!path) return { fileKey: readManifest(brand).fileKey, assets: [] }
  return readJson<AssetManifest>(path)
}

/**
 * Every committed seed asset, repo-relative and sorted — the other half of
 * what `validateAssetManifest` compares. Directory order is filesystem order,
 * so it is sorted here rather than in every caller.
 */
export function listSeedAssets(): string[] {
  return readdirSync(join(REPO_ROOT, ASSET_DIR))
    .filter((name) => !name.startsWith('.'))
    .sort()
    .map((name) => `${ASSET_DIR}/${name}`)
}

/**
 * Overwrite a committed seed asset in place (#81) — the git diff is the review
 * surface, so the re-export writes over the file rather than beside it.
 *
 * The path comes from a hand-maintained manifest, so it is checked against the
 * assets directory here as well as in `validateAssetManifest`: a sync run does
 * not validate the manifest first, and `../../` in a path would otherwise be a
 * write anywhere in the repo.
 */
export function writeSeedAsset(path: string, bytes: Uint8Array): void {
  const full = join(REPO_ROOT, path)
  if (!full.startsWith(join(REPO_ROOT, ASSET_DIR) + sep)) {
    throw new Error(`refusing to write ${path}: it is not under ${ASSET_DIR}/`)
  }
  writeFileSync(full, bytes)
}

/** `null` on the first run — no baseline is not an error. */
export function readBaseline(brand: Brand = DEFAULT_BRAND): Baseline | null {
  const path = dataPaths(brand).baseline
  return existsSync(path) ? readJson<Baseline>(path) : null
}

export function writeBaseline(baseline: Baseline, brand: Brand = DEFAULT_BRAND): void {
  writeJson(dataPaths(brand).baseline, baseline)
}

export function writeReport(report: Report, markdown: string, brand: Brand = DEFAULT_BRAND): void {
  const paths = dataPaths(brand)
  // `writeJson` has already made `data/` — both files live in it.
  writeJson(paths.reportJson, report)
  writeFileSync(paths.reportMd, markdown)
}
