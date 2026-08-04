import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { EXTRACT_DIR, writeJson } from './paths'

/**
 * When each extract ran, kept out of the extracted documents themselves.
 *
 * Every record used to carry `_meta: { type, source, extractedAt }`. The first
 * two are facts about the *run*, not the document, and `extractedAt` changes
 * on every run by definition — so a re-extract rewrote all 361 files whether
 * or not WordPress had changed a word. The 2026-08-04 run is the worked
 * example: 361 files modified, and the only non-timestamp change in any of
 * them was a Gravity Forms nonce that WordPress regenerates per render.
 *
 * With the run facts here instead, a non-empty `git diff` under
 * `data/extract/` means the *content* moved. That is what makes the snapshot
 * reviewable, and what `translated.test.ts`'s sha256 provenance has always
 * silently assumed.
 */
export interface ExtractManifest {
  /** The WordPress environment every record came from. */
  readonly source: string
  /** `_meta.type` → ISO timestamp of the run that last wrote that type. */
  readonly runs: Readonly<Record<string, string>>
}

export const MANIFEST_PATH = join(EXTRACT_DIR, '_manifest.json')

export function readManifest(): ExtractManifest {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(
      `no extract manifest at ${MANIFEST_PATH} — run: pnpm --filter @o3/migration extract`,
    )
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as ExtractManifest
}

/** When the given type was last extracted. Throws rather than inventing a date. */
export function extractedAt(type: string): string {
  const at = readManifest().runs[type]
  if (!at) throw new Error(`extract manifest has no run recorded for type "${type}"`)
  return at
}

/**
 * Merge this run's types into the manifest, leaving types it did not touch
 * alone — `extract -- --redirects` must not claim it re-read the posts.
 * Keys are sorted so the file diffs cleanly.
 */
export function recordRun(source: string, types: readonly string[], at: string): void {
  const previous = existsSync(MANIFEST_PATH) ? readManifest().runs : {}
  const runs: Record<string, string> = { ...previous }
  for (const type of types) runs[type] = at
  writeJson(MANIFEST_PATH, {
    source,
    runs: Object.fromEntries(Object.entries(runs).sort(([a], [b]) => a.localeCompare(b))),
  })
}
