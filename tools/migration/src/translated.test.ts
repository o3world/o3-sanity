import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { COLLECTION_PREFIXES } from '@o3/sanity/constants'

import { refsIn } from './lib/corpus'
import { CONVERTED_DIR, EXTRACT_DIR, SEED_DIR, TRANSLATED_DIR } from './lib/paths'
import { checkTranslation, sha256, translatedCaseStudy } from './map/caseStudy'
import { checkPathParity } from './map/paths'

/**
 * Invariants over the committed **translated** corpus (#21).
 *
 * These documents are not produced by a mapper — an agent wrote them from
 * `rules/caseStudy.md`. So there is no transform to unit-test, and this is the
 * whole mechanical safeguard: the schema shape, honest provenance, and a flag
 * on every field the schema demanded and WordPress could not supply. It
 * carries more weight since ADR 0016 — these load published, so a flag nobody
 * raised is now a claim on the live site rather than one in a draft.
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

  // `locked: false` keeps a translation in the pipeline's reach until a
  // reviewer takes it over — the only protection there is, now that these load
  // published like every other tree (ADR 0016).
  it('is born unlocked, and sourced from a WordPress `work` post', () => {
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

/**
 * Invariants that only become checkable once the whole archive is translated
 * (#22). The rules above ask "is this one document honest?"; these ask "is
 * the corpus complete, and did the batch stay inside the source?" — the two
 * failures a per-document gate cannot see.
 */
describe('the translated case-study archive', () => {
  interface Extracted {
    readonly title: string
    readonly path: string
    readonly seo: { canonicalRendered: string }
    readonly fields: { flexible_content?: unknown[] }
  }

  const extracted = readdirSync(join(EXTRACT_DIR, 'caseStudy'))
    .filter((f) => f.endsWith('.json'))
    .map((file) => ({
      file: `caseStudy/${file}`,
      doc: JSON.parse(
        readFileSync(join(EXTRACT_DIR, 'caseStudy', file), 'utf8'),
      ) as unknown as Extracted,
    }))

  const sourceOf = (doc: Translated) => extracted.find((e) => e.file === doc._meta.sourceFile)?.doc

  // The ticket's headline count. A translation batch that quietly skipped one
  // case study passes every other check in this file.
  it('translates every extracted case study, once', () => {
    const sources = translated.map(({ doc }) => doc._meta.sourceFile).sort()
    expect(sources).toEqual(extracted.map((e) => e.file).sort())
  })

  /**
   * Path parity (#26, `map/paths.ts`). Every *mapper* calls
   * `checkPathParity` on the way out; the translate track has no mapper to
   * call it, so a slug an agent shortened or tidied would have changed the
   * URL with nothing to stop it — and the #24 redirect map is generated from
   * `PATH_EXCEPTIONS`, which only knows about changes recorded there.
   */
  it('serves every case study at the path WordPress serves it at today', () => {
    for (const { file, doc } of translated) {
      const source = sourceOf(doc)
      expect(source, `${file} has no matching extract`).toBeDefined()
      const slug = (doc.slug as { current: string }).current
      const newPath = `${COLLECTION_PREFIXES.caseStudy}/${slug}`
      expect(checkPathParity(source!.seo.canonicalRendered, newPath), file).toBeNull()
    }
  })

  /**
   * Stats are the one field the rules call verbatim, and the one a reader
   * will quote back at the client. A `value` an agent rounded, unit-converted
   * or invented outright is exactly the failure `migration.source` exists to
   * make visible — this makes it visible without opening Studio.
   *
   * Only `value` is checked: `label` is legitimately edited (IRONMAN's two
   * RESULTS groups are flattened into one array, so the group heading has to
   * be folded into the label), and every such edit carries a `derived` flag.
   */
  it('never invents a stat value', () => {
    const titlesIn = (node: unknown, found: string[] = []): string[] => {
      if (Array.isArray(node)) {
        for (const item of node) titlesIn(item, found)
      } else if (node && typeof node === 'object') {
        const obj = node as Record<string, unknown>
        if (obj.acf_fc_layout === 'title' && typeof obj.title === 'string') found.push(obj.title)
        for (const value of Object.values(obj)) titlesIn(value, found)
      }
      return found
    }

    for (const { file, doc } of translated) {
      const stats = (doc.stats ?? []) as { value: string }[]
      if (stats.length === 0) continue
      const sourceValues = new Set(
        titlesIn(sourceOf(doc)?.fields.flexible_content).map((t) => t.trim()),
      )
      for (const stat of stats) {
        expect(
          sourceValues,
          `${file}: stat value "${stat.value}" is in no source title row`,
        ).toContain(stat.value)
      }
    }
  })

  /**
   * `seo` holds overrides, never resolved values (#26, `map/seo.ts`). The
   * translate track hand-applies what `mapSeo` does for every other type, so
   * the two ways that goes wrong are checked here: the ` | O3` tail Yoast's
   * template appends (which the Next.js root layout appends again), and an
   * unexpanded `%%…%%` template an editor left behind.
   */
  it('migrates SEO overrides without Yoast’s resolved decoration', () => {
    for (const { file, doc } of translated) {
      const seo = doc.seo as { title?: string; description?: string } | undefined
      if (!seo) continue
      for (const [field, value] of Object.entries(seo)) {
        if (typeof value !== 'string') continue
        expect(value, `${file}: seo.${field} carries the site-name suffix`).not.toMatch(/\|\s*O3$/)
        expect(value, `${file}: seo.${field} carries an unexpanded Yoast template`).not.toContain(
          '%%',
        )
      }
      expect(seo.title, `${file}: seo.title repeats the document title`).not.toBe(
        doc.title as string,
      )
    }
  })
})
