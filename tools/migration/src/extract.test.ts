import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readManifest } from './lib/manifest'
import { EXTRACT_DIR } from './lib/paths'

/**
 * Hand-maintained snapshots that `extract.ts` does not write, so the
 * per-record rules below do not apply to them. `yoast-sitemaps.json` is
 * curated for #24's URL diff: its `fetchedAt` is set by whoever refreshed it,
 * and it carries an `index` URL that is a fact about the snapshot itself.
 */
const HAND_MAINTAINED = new Set(['site/yoast-sitemaps.json'])

function extractFiles(): { file: string; doc: Record<string, unknown> }[] {
  const out: { file: string; doc: Record<string, unknown> }[] = []
  for (const entry of readdirSync(EXTRACT_DIR)) {
    const path = join(EXTRACT_DIR, entry)
    if (!statSync(path).isDirectory()) continue
    for (const name of readdirSync(path).filter((n) => n.endsWith('.json'))) {
      const file = `${entry}/${name}`
      if (HAND_MAINTAINED.has(file)) continue
      out.push({ file, doc: JSON.parse(readFileSync(join(path, name), 'utf8')) })
    }
  }
  return out
}

const files = extractFiles()

/**
 * `data/extract/` is the committed record of what WordPress said, and it is
 * only useful if a diff means WordPress changed.
 *
 * It did not used to. Two full extracts run minutes apart on 2026-08-04
 * rewrote 361 files: 360 differed only in `_meta.extractedAt`, and the last
 * differed only in a Gravity Forms nonce the server regenerates per render.
 * A reviewer could not tell those from a real edit, and `translated.test.ts`
 * — which sha256s these files to prove a translation still matches its source
 * — went red for a reason nobody could act on.
 *
 * These tests hold the two halves of the fix in place.
 */
describe('the committed extract snapshot', () => {
  it('has files to check', () => {
    expect(files.length).toBeGreaterThan(300)
  })

  it('carries no per-run facts in any record', () => {
    for (const { file, doc } of files) {
      // `source` and `extractedAt` describe the run, not the document, and
      // live in `_manifest.json`. A record carrying either would churn on
      // every extract.
      expect(Object.keys(doc._meta as object), file).toEqual(['type'])
    }
  })

  it('records a run in the manifest for every type on disk', () => {
    const { runs, source } = readManifest()
    expect(source).toBeTruthy()
    for (const { file, doc } of files) {
      const type = (doc._meta as { type: string }).type
      expect(runs[type], `${file} has type "${type}", absent from the manifest`).toMatch(
        /^\d{4}-\d{2}-\d{2}T/,
      )
    }
  })

  it('holds no un-normalized per-render nonce', () => {
    // The placeholder is fine; a live ciphertext is what churns.
    const live = /name=['"]gform_currency['"][^>]*value=['"](?!__O3_MIGRATION_RENDER_NONCE__)[^'"]+/
    for (const { file, doc } of files) {
      expect(live.test(JSON.stringify(doc)), `${file} still carries a live gform_currency`).toBe(
        false,
      )
    }
  })
})
