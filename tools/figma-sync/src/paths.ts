import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Baseline, Report, TrackedManifest } from './types'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'data')
const REPO_ROOT = join(ROOT, '..', '..')

/** Hand-maintained: what we watch. */
export const TRACKED_NODES = join(DATA, 'tracked-nodes.json')
/** Machine-written: last-seen file version + per-node hashes. */
export const BASELINE = join(DATA, 'baseline.json')
export const REPORT_JSON = join(DATA, 'report.json')
export const REPORT_MD = join(DATA, 'report.md')
/** Where `pnpm env:pull` puts the dev environment, FIGMA_API_KEY included. */
export const WEB_ENV_LOCAL = join(REPO_ROOT, 'apps', 'web', '.env.local')

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T
}

function writeJson(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}

export function readManifest(): TrackedManifest {
  return readJson<TrackedManifest>(TRACKED_NODES)
}

/** `null` on the first run — no baseline is not an error. */
export function readBaseline(): Baseline | null {
  return existsSync(BASELINE) ? readJson<Baseline>(BASELINE) : null
}

export function writeBaseline(baseline: Baseline): void {
  writeJson(BASELINE, baseline)
}

export function writeReport(report: Report, markdown: string): void {
  writeJson(REPORT_JSON, report)
  mkdirSync(DATA, { recursive: true })
  writeFileSync(REPORT_MD, markdown)
}
