import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { SECTION_BLOCKS } from '@o3/sanity/schemas/registry'

import type { Migration } from '@o3/sanity/types/generated'

import { CONVERTED_DIR, REPO_ROOT, SEED_DIR, TRANSLATED_DIR } from './lib/paths'

/**
 * Invariants over the committed seed corpus (#20).
 *
 * Seeds are greenfield content — nothing extracted them, so nothing gates
 * them the way a mapper's zod schema gates a converted document. These are
 * that gate: the checks that catch the errors a hand-authored (or
 * agent-authored) JSON document actually makes — a reference to a document
 * that was never seeded, an image path that does not exist on disk, a section
 * `_type` the renderer has never heard of, a duplicate `_key`.
 *
 * They matter more as the corpus grows: #23 seeds the remaining greenfield
 * pages against this same format.
 */

interface SeedDoc {
  readonly _id: string
  readonly _type: string
  readonly [key: string]: unknown
}

function readSeeds(): { file: string; doc: SeedDoc }[] {
  if (!existsSync(SEED_DIR)) return []
  const out: { file: string; doc: SeedDoc }[] = []
  for (const type of readdirSync(SEED_DIR)) {
    const dir = join(SEED_DIR, type)
    for (const name of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      out.push({
        file: `${type}/${name}`,
        doc: JSON.parse(readFileSync(join(dir, name), 'utf8')) as SeedDoc,
      })
    }
  }
  return out
}

const seeds = readSeeds()

/**
 * Everything the loader will write — all three trees. `load.ts` publishes
 * CONVERTED + SEED and loads TRANSLATED as drafts, so leaving translated out
 * silently narrows every check below: case studies live almost entirely in
 * that tree, and without it the provenance rules would be asserting over the
 * three hand-authored seeds and nothing else.
 */
const TREES = { converted: CONVERTED_DIR, seed: SEED_DIR, translated: TRANSLATED_DIR }

function readAllPipelineDocs(): { file: string; doc: SeedDoc }[] {
  const out: { file: string; doc: SeedDoc }[] = []
  for (const [label, root] of Object.entries(TREES)) {
    if (!existsSync(root)) continue
    for (const type of readdirSync(root)) {
      const dir = join(root, type)
      for (const name of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
        out.push({
          file: `${label}/${type}/${name}`,
          doc: JSON.parse(readFileSync(join(dir, name), 'utf8')) as SeedDoc,
        })
      }
    }
  }
  return out
}

/** Read once — this walks the whole corpus, currently ~315 files. */
const allPipelineDocs = readAllPipelineDocs()

/**
 * Every id the loader will write, across all three trees — the set a seed's
 * references have to land in.
 *
 * Widened from seeds-only in #56: the About team band references the migrated
 * `person` documents, which live in the CONVERTED tree. Checking only the seed
 * tree would have called a perfectly good reference dangling, and the honest
 * question is "will this resolve in the loaded dataset", which is all three.
 */
const pipelineIds = new Set(allPipelineDocs.map(({ doc }) => doc._id))

/** Every `{_ref}` anywhere in a document, however deeply nested. */
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

function markersIn(node: unknown, found: string[] = []): string[] {
  if (Array.isArray(node)) {
    for (const item of node) markersIn(item, found)
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (typeof obj._localSrc === 'string') found.push(obj._localSrc)
    for (const value of Object.values(obj)) markersIn(value, found)
  }
  return found
}

describe('committed seed content', () => {
  it('has seeds to check (a silently empty corpus would pass everything below)', () => {
    expect(seeds.length).toBeGreaterThan(0)
  })

  // `<type>-seed-<slug>` (CONTEXT.md → Migration language). Deterministic ids
  // are what let `rebuild` wipe the dataset and reproduce it from git.
  it('gives every seed a deterministic <type>-seed-<slug> id matching its folder', () => {
    for (const { file, doc } of seeds) {
      const [type] = file.split('/')
      expect(doc._type, file).toBe(type)
      expect(doc._id, file).toMatch(new RegExp(`^${type}-seed-[a-z0-9-]+$`))
    }
  })

  it('assigns every seed a unique _id', () => {
    const all = seeds.map(({ doc }) => doc._id)
    expect(all.filter((id, i) => all.indexOf(id) !== i)).toEqual([])
  })

  it('marks every seed as seeded, and leaves it unlocked', () => {
    for (const { file, doc } of seeds) {
      const migration = doc.migration as { locked?: boolean; sourceId?: string } | undefined
      expect(migration?.locked, `${file} is born locked`).toBe(false)
      expect(migration?.sourceId, file).toMatch(/^seed:/)
    }
  })

  // A dangling reference loads without complaint and renders as a hole.
  it('resolves every reference to another committed document', () => {
    for (const { file, doc } of seeds) {
      for (const ref of refsIn(doc)) {
        expect(pipelineIds, `${file} references ${ref}, which is not committed`).toContain(ref)
      }
    }
  })

  // `_localSrc` is only resolved at load time, so a typo would otherwise
  // surface as a failed load halfway through the dataset.
  it('points every image marker at a file that exists in the repo', () => {
    for (const { file, doc } of seeds) {
      for (const path of markersIn(doc)) {
        expect(existsSync(join(REPO_ROOT, path)), `${file} references missing ${path}`).toBe(true)
      }
    }
  })

  /**
   * Routes resolve a document with `*[_type == $type && slug.current == $slug][0]`,
   * so two documents claiming one slug make the served page a coin flip —
   * silently, and differently per request. This exact collision has already
   * bitten once: a leftover scaffolding `page-home` shared the homepage's
   * `index` slug and won the toss about half the time.
   */
  it('never lets two documents of one type claim the same slug', () => {
    const seen = new Map<string, string>()
    for (const { file, doc } of allPipelineDocs) {
      const slug = (doc.slug as { current?: string } | undefined)?.current
      if (!slug) continue
      const key = `${doc._type}:${slug}`
      const previous = seen.get(key)
      expect(previous, `${file} and ${previous} both claim ${key}`).toBeUndefined()
      seen.set(key, file)
    }
  })

  /**
   * Content sourcing (#40, ADR 0007).
   *
   * A case study makes claims about a real client engagement — a stat, a
   * narrative headline, an outcome. The homepage showcase needed three of them
   * before any had been translated, so three were hand-authored to fill it,
   * and at least one (`aramark`) describes work that has no WordPress source
   * at all.
   *
   * That is fine as scaffolding and indefensible as published content, so the
   * rule is mechanical: if a case study did not come from WordPress, it is
   * PROVISIONAL and says so in its own provenance. `rebuild` and the Studio
   * can then both see it, and #22 clears them by replacing each with the
   * translated original.
   */
  describe('content sourcing provenance', () => {
    const caseStudies = allPipelineDocs.filter(({ doc }) => doc._type === 'caseStudy')

    // The generated type, not a hand-copied subset: `as` casts don't error
    // when a field is renamed on the schema side, so a local shape would go
    // stale silently and these tests would keep passing against nothing.
    const provenance = (doc: SeedDoc) => (doc.migration ?? {}) as Partial<Migration>

    // Every mapper stamps this prefix; it is what "came from WordPress" means.
    const WORDPRESS = 'wp:'

    /**
     * Both guards exist because these rules are trivially satisfiable by an
     * empty set. `readAllPipelineDocs()` originally skipped TRANSLATED_DIR,
     * where every WordPress-sourced case study lives — so the rules below ran
     * against the three hand-authored seeds and nothing else, and the
     * "never provisional" rule had no document to disagree with at all. Both
     * were green and neither meant anything.
     */
    it('sees the translated tree, where real case studies live', () => {
      expect(caseStudies.length).toBeGreaterThan(0)
      const trees = new Set(caseStudies.map(({ file }) => file.split('/')[0]))
      // Asserted as "contains", not "equals": the seeds here are placeholders
      // that #22 is meant to delete, so pinning the exact set would make this
      // fail at the moment the mechanism finally succeeds.
      expect([...trees], 'the translated tree is out of scope again').toContain('translated')
    })

    it('has at least one WordPress-sourced case study, or the rules below are vacuous', () => {
      const sourced = caseStudies.filter(({ doc }) =>
        provenance(doc).sourceId?.startsWith(WORDPRESS),
      )
      expect(sourced.length).toBeGreaterThan(0)
    })

    it('marks every case study not sourced from WordPress as provisional', () => {
      for (const { file, doc } of caseStudies) {
        const { sourceId, provisional } = provenance(doc)
        if (sourceId?.startsWith(WORDPRESS)) continue
        expect(
          provisional,
          `${file} has sourceId "${sourceId}" — not from WordPress, so it invents client outcomes and must set migration.provisional`,
        ).toBe(true)
      }
    })

    it('never marks a WordPress-sourced document provisional', () => {
      for (const { file, doc } of allPipelineDocs) {
        const { sourceId, provisional } = provenance(doc)
        if (!sourceId?.startsWith(WORDPRESS)) continue
        expect(provisional, `${file} came from WordPress and cannot be provisional`).not.toBe(true)
      }
    })

    // A string "false" or 0 would read as provisional to a truthiness check in
    // a renderer and as not-provisional to `=== true` here.
    it('uses a real boolean for provisional, never a truthy stand-in', () => {
      for (const { file, doc } of allPipelineDocs) {
        const { provisional } = provenance(doc)
        if (provisional === undefined) continue
        expect(typeof provisional, `${file} sets a non-boolean provisional`).toBe('boolean')
      }
    })

    // These outlive the session that created them, and "no WordPress source
    // exists" and "waiting on #22" call for opposite actions.
    it('makes every provisional document say what would replace it', () => {
      for (const { file, doc } of allPipelineDocs) {
        const { provisional, provisionalNote } = provenance(doc)
        if (provisional !== true) continue
        expect(provisionalNote?.trim(), `${file} is provisional without saying why`).toBeTruthy()
      }
    })

    // Figma-transcribed copy records the frame it came from, so a reviewer can
    // open the node rather than hunt for it. Share URLs use `-`; the tools and
    // this field use `:` (docs/agents/figma.md).
    it('records any Figma-sourced copy against a well-formed node id', () => {
      for (const { file, doc } of allPipelineDocs) {
        const { figmaNode } = provenance(doc)
        if (figmaNode === undefined) continue
        expect(figmaNode, `${file} has a malformed figmaNode`).toMatch(/^\d+:\d+$/)
      }
    })
  })

  describe('the homepage', () => {
    const home = seeds.find(({ doc }) => doc._id === 'page-seed-index')?.doc

    it('exists at the slug the singleton route fetches', () => {
      expect(home).toBeDefined()
      expect((home?.slug as { current: string })?.current).toBe('index')
    })

    it('composes only registered section blocks — no bespoke types', () => {
      const sections = (home?.sections ?? []) as { _type: string }[]
      expect(sections.length).toBeGreaterThan(0)
      for (const s of sections) {
        expect(SECTION_BLOCKS as readonly string[], `unregistered section "${s._type}"`).toContain(
          s._type,
        )
      }
    })

    it('gives every section a _key unique within the page', () => {
      const keys = ((home?.sections ?? []) as { _key?: string }[]).map((s) => s._key)
      expect(keys.every(Boolean)).toBe(true)
      expect(new Set(keys).size).toBe(keys.length)
    })

    // `surface` is injected by defineSectionBlock's initialValue, which only
    // runs in Studio — a loaded document has to carry it explicitly or every
    // section renders on the default surface.
    it('sets an explicit surface on every section', () => {
      for (const s of (home?.sections ?? []) as { _type: string; surface?: string }[]) {
        expect(['white', 'bone', 'ink'], `${s._type} has no surface`).toContain(s.surface)
      }
    })

    // Was the prototype's sequence until #42. The frame puts the pull quote
    // straight after the case studies and both rail bands after it; Figma is
    // the source of record (map #33), so the seed moved and this moved with it.
    it('follows the canonical Home frame’s section sequence', () => {
      expect(((home?.sections ?? []) as { _type: string }[]).map((s) => s._type)).toEqual([
        'heroSection',
        'logoWallSection',
        'caseShowcaseSection',
        'quoteSection',
        'railPanelsSection',
        'railPanelsSection',
        'perspectivesCarouselSection',
        'ctaSection',
      ])
    })
  })
})
