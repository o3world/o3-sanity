import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CONVERTED_DIR, EXTRACT_DIR, SEED_DIR, TRANSLATED_DIR } from './lib/paths'
import { checkTranslation, sha256, translatedCaseStudy } from './map/caseStudy'

/**
 * Invariants over the committed **translated** corpus (#21).
 *
 * These documents are not produced by a mapper — an agent wrote them from
 * `rules/caseStudy.md`. So there is no transform to unit-test, and this is the
 * whole mechanical safeguard: the schema shape, honest provenance, a flag on
 * every field the schema demanded and WordPress could not supply, and the
 * draft-only rule.
 *
 * The one thing no test can check is whether the prose is *true to the
 * source*. That is what the PR diff and the Studio side-by-side are for, and
 * why `migration.source` travels with the draft.
 */

interface Translated {
  readonly _id: string
  readonly _meta: {
    readonly sourceFile: string
    readonly sourceHash: string
    readonly flags: { field: string; kind: string; note: string }[]
  }
  readonly [key: string]: unknown
}

function readTranslated(): { file: string; doc: Translated }[] {
  const dir = join(TRANSLATED_DIR, 'caseStudy')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((file) => ({
      file: `caseStudy/${file}`,
      doc: JSON.parse(readFileSync(join(dir, file), 'utf8')) as Translated,
    }))
}

/** Every committed document a translated one may reference. */
function committedIds(): Set<string> {
  const ids = new Set<string>()
  for (const root of [CONVERTED_DIR, SEED_DIR]) {
    if (!existsSync(root)) continue
    for (const type of readdirSync(root)) {
      for (const f of readdirSync(join(root, type)).filter((f) => f.endsWith('.json'))) {
        ids.add((JSON.parse(readFileSync(join(root, type, f), 'utf8')) as { _id: string })._id)
      }
    }
  }
  return ids
}

function refsIn(node: unknown, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) refsIn(item, found)
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (typeof obj._ref === 'string') found.push(obj._ref)
    for (const value of Object.values(obj)) refsIn(value, found)
  }
  return found
}

const translated = readTranslated()

describe('committed translations', () => {
  it('has translations to check', () => {
    expect(translated.length).toBeGreaterThan(0)
  })

  it('validates every translated document against the schema gate', () => {
    for (const { file, doc } of translated) {
      const parsed = translatedCaseStudy.safeParse(doc)
      expect(parsed.success, `${file}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
    }
  })

  // A translation done against a different source, or under different rules,
  // is not the translation that was reviewed.
  it('records provenance that still matches the files on disk', () => {
    for (const { file, doc } of translated) {
      const parsed = translatedCaseStudy.safeParse(doc)
      if (!parsed.success) continue
      const issues = checkTranslation(parsed.data)
      expect(issues, `${file}: ${JSON.stringify(issues)}`).toEqual([])
    }
  })

  it('hashes the source it actually names', () => {
    for (const { file, doc } of translated) {
      const source = join(EXTRACT_DIR, doc._meta.sourceFile)
      expect(existsSync(source), `${file} names a missing source`).toBe(true)
      expect(sha256(readFileSync(source)), file).toBe(doc._meta.sourceHash)
    }
  })

  it('resolves every reference to a committed document', () => {
    const ids = committedIds()
    for (const { file, doc } of translated) {
      for (const ref of refsIn(doc)) {
        expect(ids, `${file} references ${ref}, which is not committed`).toContain(ref)
      }
    }
  })

  // The pipeline never publishes a translation, in any mode. `locked: false`
  // keeps it in the pipeline's reach until a reviewer takes it over.
  it('is born unlocked and never carries a published marker', () => {
    for (const { file, doc } of translated) {
      const migration = doc.migration as { locked?: boolean; sourceId?: string }
      expect(migration.locked, `${file} is born locked`).toBe(false)
      expect(migration.sourceId, file).toMatch(/^wp:work:\d+$/)
    }
  })

  it('explains every flag it raises', () => {
    for (const { file, doc } of translated) {
      expect(doc._meta.flags.length, `${file} raised no flags at all`).toBeGreaterThan(0)
      for (const flag of doc._meta.flags) {
        expect(flag.note.length, `${file}: ${flag.field} has an empty note`).toBeGreaterThan(20)
      }
    }
  })

  // The failure mode this whole track exists to prevent: an agent filling a
  // required field with plausible copy and saying nothing.
  it('flags every required field WordPress could not supply', () => {
    for (const { file, doc } of translated) {
      const flagged = new Set(doc._meta.flags.map((f) => f.field))
      expect(flagged, `${file} did not flag its narrativeHeadline`).toContain('narrativeHeadline')
      const chapters = (doc.chapters ?? []) as unknown[]
      chapters.forEach((_, i) => {
        expect(flagged, `${file} did not flag chapters[${i}].title`).toContain(
          `chapters[${i}].title`,
        )
      })
    }
  })
})
