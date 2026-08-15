import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { COLLECTION_PREFIXES } from '@o3/sanity/constants'
import { SECTION_BLOCKS } from '@o3/sanity/schemas/registry'

import type { Migration } from '@o3/sanity/types/generated'

import { refsIn } from './lib/corpus'
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
   * and two of them (`aramark`, `chop`) described work that has no WordPress
   * source at all.
   *
   * That is fine as scaffolding and indefensible as published content, so the
   * rule is mechanical: if a case study did not come from WordPress, it is
   * PROVISIONAL and says so in its own provenance. ADR 0016 has since deleted
   * all three and the corpus is 20 WordPress-sourced case studies with no
   * exceptions — which is what the rule wanted, and exactly the state in which
   * a rule is easiest to lose. It stays: the next person to fill a gap with
   * plausible copy meets it, not a reviewer.
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
      // Asserted as "contains", not "equals": every case study lives in the
      // translated tree today, and a seeded one is legitimate again the moment
      // a greenfield card needs a document. What must never happen is this
      // scope narrowing back to the seed tree, where the rules below would
      // have nothing to check.
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

  /**
   * Composition rules for every seeded page — widened from the homepage in
   * #48. They were written against `page-seed-index` because it was the only
   * seeded page there was; the corpus is now eight pages, and a rule that
   * only checks the first one is a rule the next page silently skips. Nothing
   * here is homepage-specific, so nothing here should be homepage-only.
   */
  describe('every seeded page', () => {
    const pages = seeds.filter(({ doc }) => doc._type === 'page')
    const sectionsOf = (doc: SeedDoc) => (doc.sections ?? []) as Record<string, unknown>[]

    it('has pages to check', () => {
      expect(pages.length).toBeGreaterThan(0)
    })

    it('composes only registered section blocks — no bespoke types', () => {
      for (const { file, doc } of pages) {
        const sections = sectionsOf(doc)
        expect(sections.length, `${file} has no sections`).toBeGreaterThan(0)
        for (const s of sections) {
          expect(
            SECTION_BLOCKS as readonly string[],
            `${file}: unregistered section "${String(s._type)}"`,
          ).toContain(s._type)
        }
      }
    })

    it('gives every section a _key unique within the page', () => {
      for (const { file, doc } of pages) {
        const keys = sectionsOf(doc).map((s) => s._key)
        expect(keys.every(Boolean), `${file} has a section with no _key`).toBe(true)
        expect(new Set(keys).size, `${file} repeats a section _key`).toBe(keys.length)
      }
    })

    // `surface` is injected by defineSectionBlock's initialValue, which only
    // runs in Studio — a loaded document has to carry it explicitly or every
    // section renders on the default surface.
    it('sets an explicit surface on every section', () => {
      for (const { file, doc } of pages) {
        for (const s of sectionsOf(doc)) {
          expect(['white', 'bone', 'ink'], `${file}: ${String(s._type)} has no surface`).toContain(
            s.surface,
          )
        }
      }
    })

    // Routes match `slug.current` against the request path, so a stored
    // leading or trailing slash produces a slug nothing can ever resolve.
    it('stores a lowercase URL-safe slug, with no slash or hyphen at either end', () => {
      for (const { file, doc } of pages) {
        const slug = (doc.slug as { current?: string } | undefined)?.current
        expect(slug, `${file} has no slug`).toBeTruthy()
        expect(slug, `${file} slug "${slug}" carries a slash at an end`).toMatch(
          /^[a-z0-9][a-z0-9/-]*[a-z0-9]$/,
        )
      }
    })
  })

  /**
   * The inquiry form (#58).
   *
   * Schema validation runs in Studio, and a seed never goes through Studio —
   * `load` writes the JSON straight to the dataset. So a `required()` rule on
   * `reasons` or `submitLabel` is enforced for an editor and enforced by
   * nothing at all for the corpus, which is where every form on the site
   * currently comes from. These are that enforcement.
   */
  describe('every seeded form band', () => {
    const forms = seeds
      .filter(({ doc }) => doc._type === 'page')
      .flatMap(({ file, doc }) =>
        ((doc.sections ?? []) as Record<string, unknown>[])
          .filter((s) => s._type === 'formSection')
          .map((section) => ({ file, section })),
      )

    it('has a form to check', () => {
      expect(forms.length).toBeGreaterThan(0)
    })

    // The dropdown is the one part of the field set the editor owns
    // (ADR 0014). An empty array renders a select with nothing but the
    // placeholder in it — a required field nobody can satisfy.
    it('gives every form at least one Reason option', () => {
      for (const { file, section } of forms) {
        const reasons = section.reasons as unknown[] | undefined
        expect(Array.isArray(reasons), `${file}: formSection has no reasons array`).toBe(true)
        expect(reasons?.length, `${file}: formSection has an empty reasons list`).toBeGreaterThan(0)
      }
    })

    it('gives every form a submit label', () => {
      for (const { file, section } of forms) {
        expect(
          typeof section.submitLabel === 'string' && section.submitLabel.trim().length > 0,
          `${file}: formSection has no submitLabel`,
        ).toBe(true)
      }
    })

    it('gives every form a heading', () => {
      for (const { file, section } of forms) {
        expect(
          typeof section.heading === 'string' && section.heading.trim().length > 0,
          `${file}: formSection has no heading`,
        ).toBe(true)
      }
    })
  })

  /**
   * `/contact` is the site's one conversion path (#58, #48). Losing the form
   * band to a careless edit would be a silent functional regression against
   * the live site — exactly the one this ticket exists to close — and every
   * other check here would stay green through it.
   */
  describe('the contact page', () => {
    const contact = seeds.find(({ doc }) => doc._id === 'page-seed-contact')?.doc

    it('exists', () => {
      expect(contact).toBeDefined()
    })

    it('carries a form band', () => {
      const types = ((contact?.sections ?? []) as { _type: string }[]).map((s) => s._type)
      expect(types).toContain('formSection')
    })

    /**
     * The form has no handler and no destination yet, so the page stays
     * provisional — and the note has to say which halves are still open, not
     * just that something is. When #58's mechanism and destination land,
     * this fails and the note gets rewritten with it.
     */
    it('still declares itself provisional, naming what is open', () => {
      const migration = (contact?.migration ?? {}) as Partial<Migration>
      expect(migration.provisional).toBe(true)
      expect(migration.provisionalNote).toMatch(/#58/)
    })
  })

  /**
   * No dead ends in the wireframe sitemap (#23).
   *
   * A `button.href` is a plain string, not a reference — the loader will not
   * complain about it, `verify` cannot see it, and the page renders a link
   * that 404s. That is the one failure this corpus can ship silently, and it
   * gets easier to ship with every page seeded, so it is checked here rather
   * than found in a browser.
   *
   * Scoped to `button` objects — the nav, the footer, and every button a seeded
   * page draws. That is the set this build authors. Portable Text `link`
   * marks are deliberately out: 272 migrated insight bodies link into a
   * 2017 URL space (`/careers`, `/labs/o3-barista/`, `/about/team/…`) that
   * this redesign does not have, and auditing the archive's editorial links
   * is its own ticket, not a gate on seeding a page.
   *
   * Only app-relative hrefs are checked; an external URL is somebody else's
   * uptime.
   */
  describe('internal links', () => {
    const CODE_ROUTES = new Set(['/', ...Object.values(COLLECTION_PREFIXES)])

    /** Every `button.href` in a document, with the path that reached it. */
    function buttonHrefsIn(
      node: unknown,
      path = '',
      found: { path: string; href: string }[] = [],
    ): { path: string; href: string }[] {
      if (Array.isArray(node)) {
        node.forEach((item, i) => buttonHrefsIn(item, `${path}[${i}]`, found))
      } else if (node && typeof node === 'object') {
        const obj = node as Record<string, unknown>
        if (obj._type === 'button' && typeof obj.href === 'string') {
          found.push({ path: path || '(root)', href: obj.href })
        }
        for (const [key, value] of Object.entries(obj)) {
          buttonHrefsIn(value, path ? `${path}.${key}` : key, found)
        }
      }
      return found
    }

    /** `{type: slug}` for every document the loader will write. */
    const slugsByType = new Map<string, Set<string>>()
    for (const { doc } of allPipelineDocs) {
      const slug = (doc.slug as { current?: string } | undefined)?.current
      if (!slug) continue
      slugsByType.set(doc._type, (slugsByType.get(doc._type) ?? new Set()).add(slug))
    }

    const internalLinks = allPipelineDocs.flatMap(({ file, doc }) =>
      buttonHrefsIn(doc)
        .filter(({ href }) => href.startsWith('/'))
        .map(({ path, href }) => ({ file, path, href })),
    )

    it('has internal links to check', () => {
      expect(internalLinks.length).toBeGreaterThan(0)
    })

    it('points every internal link at something that resolves', () => {
      for (const { file, path, href } of internalLinks) {
        // Strip a fragment and any trailing slash — `/about#careers` is the
        // About page, and routes match without the slash.
        const target = href.split('#')[0]!.replace(/\/+$/, '') || '/'
        if (CODE_ROUTES.has(target)) continue

        const where = `${file} → ${path}: "${href}"`
        const collection = Object.entries(COLLECTION_PREFIXES).find(([, prefix]) =>
          target.startsWith(`${prefix}/`),
        )
        if (collection) {
          const [type, prefix] = collection
          expect(
            slugsByType.get(type) ?? new Set(),
            `${where} names no committed ${type}`,
          ).toContain(target.slice(prefix.length + 1))
          continue
        }

        expect(slugsByType.get('page') ?? new Set(), `${where} names no committed page`).toContain(
          target.slice(1),
        )
      }
    })
  })

  describe('the homepage', () => {
    const home = seeds.find(({ doc }) => doc._id === 'page-seed-index')?.doc

    it('exists at the slug the singleton route fetches', () => {
      expect(home).toBeDefined()
      expect((home?.slug as { current: string })?.current).toBe('index')
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
        'insightsCarouselSection',
        'ctaSection',
      ])
    })
  })
})
