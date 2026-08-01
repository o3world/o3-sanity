import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { SECTION_BLOCKS } from '@o3/sanity/schemas/registry'

import { CONVERTED_DIR, REPO_ROOT, SEED_DIR } from './lib/paths'

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
const ids = new Set(seeds.map(({ doc }) => doc._id))

/** Everything the loader will write: converted documents plus seeds. */
function readAllPipelineDocs(): { file: string; doc: SeedDoc }[] {
  const out: { file: string; doc: SeedDoc }[] = []
  for (const root of [CONVERTED_DIR, SEED_DIR]) {
    if (!existsSync(root)) continue
    for (const type of readdirSync(root)) {
      const dir = join(root, type)
      for (const name of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
        out.push({
          file: `${root === SEED_DIR ? 'seed' : 'converted'}/${type}/${name}`,
          doc: JSON.parse(readFileSync(join(dir, name), 'utf8')) as SeedDoc,
        })
      }
    }
  }
  return out
}

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
        expect(ids, `${file} references ${ref}, which is not seeded`).toContain(ref)
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
    for (const { file, doc } of readAllPipelineDocs()) {
      const slug = (doc.slug as { current?: string } | undefined)?.current
      if (!slug) continue
      const key = `${doc._type}:${slug}`
      const previous = seen.get(key)
      expect(previous, `${file} and ${previous} both claim ${key}`).toBeUndefined()
      seen.set(key, file)
    }
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

    it('follows the prototype’s section sequence', () => {
      expect(((home?.sections ?? []) as { _type: string }[]).map((s) => s._type)).toEqual([
        'heroSection',
        'logoWallSection',
        'caseShowcaseSection',
        'railPanelsSection',
        'quoteSection',
        'railPanelsSection',
        'perspectivesCarouselSection',
        'ctaSection',
      ])
    })
  })
})
