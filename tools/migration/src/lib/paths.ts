import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DATA = join(ROOT, 'data')
/** The monorepo root — `_localSrc` seed asset paths resolve against it. */
export const REPO_ROOT = join(ROOT, '..', '..')
export const EXTRACT_DIR = join(DATA, 'extract')
export const CONVERTED_DIR = join(DATA, 'converted')
export const TRANSLATED_DIR = join(DATA, 'translated')
export const SEED_DIR = join(DATA, 'seed')
export const MEDIA_CACHE = join(DATA, 'media-cache')
export const ASSET_MAP = join(DATA, 'assets.json')

export function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}
