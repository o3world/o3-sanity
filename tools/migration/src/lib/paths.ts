import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Brand } from '@o3/sanity/brand'

import { brandArg } from './brandArg'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
/** The monorepo root — `_localSrc` seed asset paths resolve against it. */
export const REPO_ROOT = join(ROOT, '..', '..')

/**
 * One committed corpus per brand, in its own tree.
 *
 * Two brands cannot share one tree: the committed JSON is the source of truth
 * (ADR 0003), `load` recreates every unlocked pipeline-owned document it finds
 * in the tree, and both brands seed a `page-seed-index` homepage. Pointing one
 * `load` at a shared directory would have each brand's run retire the other's
 * documents on the way past.
 *
 * o3's root keeps its unsuffixed name because 313 committed documents carry
 * their own asset paths (`_localSrc: "tools/migration/data/seed/assets/…"`) and
 * `data/assets.json` is keyed by them. The roots are siblings rather than
 * `data/<brand>/` for a plainer reason: nested, o3's root would contain O3XO's,
 * and everything that walks o3's corpus would silently walk both.
 */
const DATA_ROOTS: Readonly<Record<Brand, string>> = {
  o3: join(ROOT, 'data'),
  o3xo: join(ROOT, 'data-o3xo'),
}

export function dataRoot(brand: Brand): string {
  return DATA_ROOTS[brand]
}

/**
 * The tree this run works in, resolved once from the run's `--brand` — the same
 * shape `resolveDataset()` uses for the dataset, and for the same reason: the
 * commands that read these constants (`extract`, `convert`, `load`, `verify`)
 * must not be able to disagree about which brand's corpus they are holding.
 *
 * Under vitest no flag is passed and `NEXT_PUBLIC_BRAND` is unset, so these
 * resolve to o3's tree, which is what every corpus test asserts against.
 */
const DATA = dataRoot(brandArg())

export const EXTRACT_DIR = join(DATA, 'extract')
export const CONVERTED_DIR = join(DATA, 'converted')
export const TRANSLATED_DIR = join(DATA, 'translated')
export const SEED_DIR = join(DATA, 'seed')
export const MEDIA_CACHE = join(DATA, 'media-cache')
/** Translation rule files — the contract an agent translates under (#21). */
export const RULES_DIR = join(ROOT, 'rules')
export const ASSET_MAP = join(DATA, 'assets.json')
/** Source URLs whose binary is gone — a committed record, see load.ts. */
export const MISSING_MEDIA = join(DATA, 'missing-media.json')

export function writeJson(path: string, value: unknown) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n')
}
