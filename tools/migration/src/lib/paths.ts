import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
/** The monorepo root — `_localSrc` seed asset paths resolve against it. */
export const REPO_ROOT = join(ROOT, '..', '..')

/**
 * The committed corpus. Seeds carry their own asset paths
 * (`_localSrc: "tools/migration/data/seed/assets/…"`) and `data/assets.json` is
 * keyed by them, so this directory's name is part of the data.
 */
const DATA = join(ROOT, 'data')

export const EXTRACT_DIR = join(DATA, 'extract')
export const CONVERTED_DIR = join(DATA, 'converted')
export const TRANSLATED_DIR = join(DATA, 'translated')
export const SEED_DIR = join(DATA, 'seed')
/** Translation rule files — the contract an agent translates under (#21). */
export const RULES_DIR = join(ROOT, 'rules')
export const ASSET_MAP = join(DATA, 'assets.json')
/** Source URLs whose binary is gone — a committed record `drift` reads. */
export const MISSING_MEDIA = join(DATA, 'missing-media.json')

export function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}
