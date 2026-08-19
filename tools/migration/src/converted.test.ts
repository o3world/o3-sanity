import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { BLOCK_KNOBS } from '@o3/sanity/knobs'
import { SECTION_BLOCKS } from '@o3/sanity/schemas/registry'

import { CORPUS_DIRS, refsIn } from './lib/corpus'
import { CONVERTED_DIR, EXTRACT_DIR } from './lib/paths'
import type { WpSeo } from './lib/yoast'
import { categoryDoc } from './map/category'
import { checkPathParity } from './map/paths'
import { pageDoc } from './map/page'
import { personDoc } from './map/person'
import { siteSettingsDoc } from './map/siteSettings'
import { insightDoc } from './map/insight'

/**
 * Invariants over the ACTUAL committed conversion output, not fixtures.
 *
 * The mapper tests prove one document converts correctly; these prove the
 * whole committed corpus holds together — which is the check that earns its
 * keep as the corpus grows from 18 documents to ~340 (#17, #18, #22). A
 * dangling author reference or a body block the renderer has never seen is
 * the kind of thing that survives a green build and fails in Studio.
 *
 * Content is data reviewed in PRs (#25 agreement 1); this is the automated
 * half of that review.
 */

function readType<T>(type: string): { file: string; doc: T }[] {
  const dir = join(CONVERTED_DIR, type)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((file) => ({ file, doc: JSON.parse(readFileSync(join(dir, file), 'utf8')) as T }))
}

/** Every committed document, in all three trees — converted, seed, translated. */
function corpusDocs(): unknown[] {
  const docs: unknown[] = []
  for (const root of CORPUS_DIRS) {
    if (!existsSync(root)) continue
    for (const type of readdirSync(root)) {
      for (const file of readdirSync(join(root, type)).filter((f) => f.endsWith('.json'))) {
        docs.push(JSON.parse(readFileSync(join(root, type, file), 'utf8')))
      }
    }
  }
  return docs
}

const insights = readType<Record<string, unknown>>('insight')
const categories = readType<Record<string, unknown>>('category')
const persons = readType<Record<string, unknown>>('person')
const siteSettings = readType<Record<string, unknown>>('siteSettings')
const pages = readType<Record<string, unknown>>('page')
const all = [...insights, ...categories, ...persons, ...siteSettings, ...pages]

/**
 * The closed set of block types the `bodyText` schema allows. A converter that
 * starts emitting something else has invented a schema type, which is a schema
 * conversation rather than a mapper change (#25 agreement 1).
 */
const ALLOWED_BODY_TYPES = new Set(['block', 'figure', 'embed', 'pullQuote'])

describe('committed conversion output', () => {
  it('has documents to check (a silently empty corpus would pass everything below)', () => {
    expect(all.length).toBeGreaterThan(0)
  })

  it('validates every insight against the schema gate', () => {
    for (const { file, doc } of insights) {
      const parsed = insightDoc.safeParse(doc)
      expect(parsed.success, `${file}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
    }
  })

  it('validates every migrated page against its schema gate', () => {
    for (const { file, doc } of pages) {
      const parsed = pageDoc.safeParse(doc)
      expect(parsed.success, `${file}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
    }
  })

  it('composes migrated pages from registered section blocks only', () => {
    for (const { file, doc } of pages) {
      for (const section of doc.sections as { _type: string }[]) {
        expect(SECTION_BLOCKS as readonly string[], `${file} has "${section._type}"`).toContain(
          section._type,
        )
      }
    }
  })

  /**
   * The committed half of the surface contract the mapper tests hold at the
   * other end (`map/page.test.ts`). A section block either offers the choice
   * with a `surface` knob or fixes it with `paintsOwnSurface`, and a document
   * that stores a surface for the second kind stores content nothing reads.
   * Asked of the declaration, so the day a fourth band stops offering the
   * choice this test already knows.
   */
  it('stores a surface only on sections that offer the choice', () => {
    for (const { file, doc } of pages) {
      for (const section of doc.sections as Record<string, unknown>[]) {
        const type = String(section._type)
        const spec = BLOCK_KNOBS[type as keyof typeof BLOCK_KNOBS]
        if (spec?.paintsOwnSurface !== undefined) {
          expect(section.surface, `${file}: ${type} paints its own surface`).toBeUndefined()
          continue
        }
        expect(['white', 'bone', 'ink'], `${file}: ${type} has no surface`).toContain(
          section.surface,
        )
      }
    }
  })

  it('validates the siteSettings singleton against its schema gate', () => {
    for (const { file, doc } of siteSettings) {
      const parsed = siteSettingsDoc.safeParse(doc)
      expect(parsed.success, `${file}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
    }
  })

  it('validates every category and person against their schema gates', () => {
    for (const { file, doc } of categories) {
      expect(categoryDoc.safeParse(doc).success, file).toBe(true)
    }
    for (const { file, doc } of persons) {
      expect(personDoc.safeParse(doc).success, file).toBe(true)
    }
  })

  it('assigns every document a unique _id', () => {
    const ids = all.map(({ doc }) => doc._id as string)
    const duplicated = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(duplicated).toEqual([])
  })

  /**
   * A byline is optional (#32 item 1.1) — WordPress shows one only where an
   * editor set the ACF author, so most insights carry none. What must
   * still hold is the pair of invariants around the ones that do: the
   * reference resolves, and no person document is committed that nothing
   * attributes (person emission is reference-driven in `convert.ts`, so a
   * stray one means a stale file on disk).
   */
  it('resolves every author reference to a committed person document', () => {
    const personIds = new Set(persons.map(({ doc }) => doc._id as string))
    for (const { file, doc } of insights) {
      const ref = (doc.author as { _ref: string } | undefined)?._ref
      if (!ref) continue
      expect(personIds, `${file} references missing author ${ref}`).toContain(ref)
    }
  })

  it('commits no person document that nothing references', () => {
    const referenced = new Set(
      corpusDocs()
        .flatMap((doc) => refsIn(doc))
        .filter((ref) => ref.startsWith('person-')),
    )
    for (const { file, doc } of persons) {
      expect([...referenced], `${file} is referenced by nothing`).toContain(doc._id as string)
    }
  })

  it('resolves every category reference to a committed category document', () => {
    const categoryIds = new Set(categories.map(({ doc }) => doc._id as string))
    for (const { file, doc } of insights) {
      for (const ref of doc.categories as { _ref: string }[]) {
        expect(categoryIds, `${file} references missing category ${ref._ref}`).toContain(ref._ref)
      }
    }
  })

  it('emits only body block types the bodyText schema allows', () => {
    for (const { file, doc } of insights) {
      for (const block of doc.body as { _type: string }[]) {
        expect(ALLOWED_BODY_TYPES, `${file} has an unexpected block "${block._type}"`).toContain(
          block._type,
        )
      }
    }
  })

  it('gives every body block a _key unique within its document', () => {
    for (const { file, doc } of insights) {
      const keys = (doc.body as { _key?: string }[]).map((b) => b._key)
      expect(keys.every(Boolean), `${file} has a body block with no _key`).toBe(true)
      expect(new Set(keys).size, `${file} has duplicate body _keys`).toBe(keys.length)
    }
  })

  // The loader refuses to touch a locked document (ADR 0003). Anything the
  // converter produced is by definition re-derivable from git, so it must
  // never be born locked — that would freeze it against its own pipeline.
  it('leaves every converted document unlocked', () => {
    for (const { file, doc } of all) {
      expect((doc.migration as { locked: boolean }).locked, file).toBe(false)
    }
  })

  it('records provenance on every document so a doc traces back to WordPress', () => {
    for (const { file, doc } of all) {
      const migration = doc.migration as { sourceId?: string }
      // Documents are keyed by WordPress id. `wp:team:` is a person who
      // never had a WP account (#17); the siteSettings singleton has no id of
      // its own — it is assembled from menus and the options page.
      expect(migration.sourceId, file).toMatch(
        /^wp:(post|page|term|user|team):\d+$|^wp:site:chrome$/,
      )
    }
  })

  /**
   * `extractedAt` is a fact about the extract *run*, so it lives in
   * `data/extract/_manifest.json` and `load.ts` stamps it onto the document on
   * its way to Sanity. Storing it here made every `convert` rewrite all 272
   * files whether or not WordPress had changed anything, which buried real
   * content changes in timestamp noise. Studio still shows the field.
   */
  it('does not store the extract timestamp, so convert output is content-only', () => {
    for (const { file, doc } of all) {
      expect(doc.migration, file).not.toHaveProperty('extractedAt')
    }
  })

  // Path parity (#26). The mapper gates this per document at convert time;
  // this re-checks the committed corpus, so a hand-edited slug in
  // data/converted/ is caught too.
  it('serves every insight at the path WordPress serves it at, or a recorded move', () => {
    // `extract/perspective/` — the extract tree keeps WordPress's vocabulary
    // (ADR 0017). Reading the wrong directory here would make `existsSync`
    // skip every document and the check would pass without testing anything,
    // so the count is asserted below.
    let checked = 0
    for (const { file, doc } of insights) {
      const extract = join(EXTRACT_DIR, 'perspective', file)
      if (!existsSync(extract)) continue
      const { seo } = JSON.parse(readFileSync(extract, 'utf8')) as { seo?: WpSeo }
      const slug = (doc.slug as { current: string }).current
      const issue = checkPathParity(seo?.canonicalRendered ?? '', `/insights/${slug}`)
      expect(issue?.detail, file).toBeUndefined()
      checked++
    }
    expect(checked, 'no migrated insight was checked — wrong extract directory?').toBeGreaterThan(
      200,
    )
  })

  // A canonical pointing back at www.o3world.com tells Google the new page is
  // a duplicate of the old one — the single most expensive thing this
  // migration could get wrong.
  it('never carries a canonical pointing at the WordPress host', () => {
    for (const { file, doc } of all) {
      const canonical = (doc.seo as { canonical?: string } | undefined)?.canonical
      expect(canonical ?? '', file).not.toContain('o3world.com')
    }
  })

  // Images are migrated from the full-size original; a `-768x432` suffix means
  // a thumbnail slipped through and the asset would upload at the wrong size.
  it('points every image marker at a full-size upload, never a WP thumbnail', () => {
    for (const { file, doc } of insights) {
      const markers = JSON.stringify(doc).match(/"_wpSrc":"[^"]+"/g) ?? []
      for (const marker of markers) {
        expect(marker, `${file} migrates a thumbnail`).not.toMatch(/-\d+x\d+\.\w+"$/)
      }
    }
  })
})
