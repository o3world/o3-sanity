import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { ASSET_DIR } from './asset-manifest'

import type { AssetManifest, Baseline, Report, TrackedManifest } from './types'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'data')
/** The monorepo root — the manifest's `codeComponent` paths are relative to it. */
export const REPO_ROOT = join(ROOT, '..', '..')

/** Where `pnpm env:pull` puts the dev environment, FIGMA_API_KEY included. */
export const WEB_ENV_LOCAL = join(REPO_ROOT, 'apps', 'web', '.env.local')

/**
 * The committed files a run reads and writes: the two hand-maintained
 * manifests (what to watch, where every seed asset came from), the baseline
 * that makes the next run cheap, and the report of the last run with
 * something to say.
 */
export const DATA_PATHS = {
  trackedNodes: join(DATA, 'tracked-nodes.json'),
  assetManifest: join(DATA, 'asset-manifest.json'),
  baseline: join(DATA, 'baseline.json'),
  reportJson: join(DATA, 'report.json'),
  reportMd: join(DATA, 'report.md'),
} as const

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}

export function readManifest(): TrackedManifest {
  return readJson<TrackedManifest>(DATA_PATHS.trackedNodes)
}

export function readAssetManifest(): AssetManifest {
  return readJson<AssetManifest>(DATA_PATHS.assetManifest)
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
export function readBaseline(): Baseline | null {
  const path = DATA_PATHS.baseline
  return existsSync(path) ? readJson<Baseline>(path) : null
}

export function writeBaseline(baseline: Baseline): void {
  writeJson(DATA_PATHS.baseline, baseline)
}

export function writeReport(report: Report, markdown: string): void {
  // `writeJson` has already made `data/` — both files live in it.
  writeJson(DATA_PATHS.reportJson, report)
  writeFileSync(DATA_PATHS.reportMd, markdown)
}
