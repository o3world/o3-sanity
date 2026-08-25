import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { collectionPrefixes } from '@o3/sanity/brand'
import { offersSurface } from './lib/surfaceContract'
import { BLOCK_ARRAYS, SECTION_BLOCKS } from '@o3/sanity/schemas/registry'

import type { Migration } from '@o3/sanity/types/generated'

import { BRIEF_ID, corpusPath, readCorpus, refsIn } from './core/read'
import { REPO_ROOT } from './lib/paths'

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

/** The seed tree alone, named `<type>/<file>` — the id rules read the type off it. */
const seeds = readCorpus<SeedDoc>('seed').map((entry) => ({
  file: `${entry.type}/${entry.file}`,
  doc: entry.document,
}))

/**
 * Everything the loader will write — all three trees. Leaving one out silently
 * narrows every check below: case studies live almost entirely in the
 * translated tree, and without it the provenance rules would be asserting over
 * the three hand-authored seeds and nothing else.
 *
 * Read once — this walks the whole corpus, currently ~315 files.
 */
const allPipelineDocs = readCorpus<SeedDoc>().map((entry) => ({
  file: corpusPath(entry),
  doc: entry.document,
}))

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

/** Every member of a `briefs` array in a document, with the path that reached it. */
function briefEntriesIn(
  node: unknown,
  path = '',
  found: { path: string; entry: unknown }[] = [],
): { path: string; entry: unknown }[] {
  if (Array.isArray(node)) {
    node.forEach((item, i) => briefEntriesIn(item, `${path}[${i}]`, found))
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const here = path ? `${path}.${key}` : key
      if (key === 'briefs' && Array.isArray(value)) {
        value.forEach((entry, i) => found.push({ path: `${here}[${i}]`, entry }))
      }
      briefEntriesIn(value, here, found)
    }
  }
  return found
}

/**
 * Paths of brief-shaped references sitting outside any `briefs` array. The
 * resolver test skips every `brief-<key>` id and `briefEntriesIn` only walks
 * arrays literally keyed `briefs`, so without this a strong or misplaced
 * brief reference would escape both gates and dangle forever.
 */
function strayBriefRefPaths(node: unknown, path = '', found: string[] = []): string[] {
  if (Array.isArray(node)) {
    node.forEach((item, i) => strayBriefRefPaths(item, `${path}[${i}]`, found))
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    if (
      typeof obj._ref === 'string' &&
      BRIEF_ID.test(obj._ref) &&
      !/(^|\.)briefs\[\d+\]$/.test(path)
    ) {
      found.push(path || '(root)')
    }
    for (const [key, value] of Object.entries(obj)) {
      strayBriefRefPaths(value, path ? `${path}.${key}` : key, found)
    }
  }
  return found
}

/** Why a `briefs` entry is malformed, or `null` when it is the shape ADR 0027 asks for. */
function briefEntryProblem(entry: unknown): string | null {
  if (!entry || typeof entry !== 'object') return 'is not an object'
  const { _type, _ref, _weak } = entry as Record<string, unknown>
  if (_type !== 'reference') return `has _type "${String(_type)}", not "reference"`
  if (typeof _ref !== 'string' || !BRIEF_ID.test(_ref)) {
    return `points at "${String(_ref)}", which is not a brief-<key> id`
  }
  if (_weak !== true) return 'is a strong reference — provenance must never block a publish'
  return null
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
  //
  // A brief is the one exception: it is synced by `brief:sync` rather than
  // loaded, so it is never committed under `data/` and its reference is weak
  // for exactly that reason (ADR 0027). The shape of those references is
  // checked below instead.
  it('resolves every reference to another committed document', () => {
    for (const { file, doc } of seeds) {
      for (const ref of refsIn(doc)) {
        if (BRIEF_ID.test(ref)) continue
        expect(pipelineIds, `${file} references ${ref}, which is not committed`).toContain(ref)
      }
    }
  })

  /**
   * The `briefs` array (ADR 0027) — per-piece background an agent fetches
   * before drafting, pointed at from seed JSON.
   *
   * Two things have to hold, and neither loads with an error when it does not.
   * The id has to be the deterministic `brief-<key>` the sync writes, or the
   * reference resolves to nothing forever. And the reference has to be
   * **weak**, or a piece is publish-blocked and delete-locked by its own
   * provenance — the one thing the ADR spends the weak flag to prevent.
   */
  describe('brief references', () => {
    // The committed corpus only contains the shape that is right, so the
    // wrong ones are put to the rule directly.
    it('accepts the shape ADR 0027 asks for, and names what is wrong with the rest', () => {
      expect(
        briefEntryProblem({ _type: 'reference', _ref: 'brief-sanity-partner', _weak: true }),
      ).toBeNull()
      expect(briefEntryProblem({ _type: 'reference', _ref: 'brief-sanity-partner' })).toMatch(
        /strong reference/,
      )
      expect(
        briefEntryProblem({ _type: 'reference', _ref: 'guidance-o3-voice', _weak: true }),
      ).toMatch(/not a brief-<key> id/)
      expect(briefEntryProblem({ _ref: 'brief-sanity-partner', _weak: true })).toMatch(
        /not "reference"/,
      )
      expect(briefEntryProblem('brief-sanity-partner')).toMatch(/not an object/)
    })

    it('finds a briefs array wherever it sits on a document', () => {
      const entry = { _type: 'reference', _ref: 'brief-one', _weak: true }
      expect(briefEntriesIn({ _id: 'insight-seed-x', briefs: [entry] })).toEqual([
        { path: 'briefs[0]', entry },
      ])
    })

    it('carries only weak brief-<key> references in the committed corpus', () => {
      const offenders = allPipelineDocs.flatMap(({ file, doc }) =>
        briefEntriesIn(doc)
          .map(({ path, entry }) => ({ path, problem: briefEntryProblem(entry) }))
          .filter(({ problem }) => problem !== null)
          .map(({ path, problem }) => `${file} → ${path} ${problem}`),
      )
      expect(offenders).toEqual([])
    })

    it('sees a brief-shaped reference hiding outside a briefs array', () => {
      expect(
        strayBriefRefPaths({
          _id: 'insight-seed-x',
          related: [{ _type: 'reference', _ref: 'brief-one', _weak: true }],
        }),
      ).toEqual(['related[0]'])
      expect(
        strayBriefRefPaths({
          _id: 'insight-seed-x',
          briefs: [{ _type: 'reference', _ref: 'brief-one', _weak: true }],
        }),
      ).toEqual([])
    })

    it('confines brief-shaped references to briefs arrays across the corpus', () => {
      const offenders = allPipelineDocs.flatMap(({ file, doc }) =>
        strayBriefRefPaths(doc).map((path) => `${file} → ${path}`),
      )
      expect(offenders).toEqual([])
    })

    /**
     * The other end of the reference — that a markdown file registers the key
     * it points at — is asserted in `tools/guidance`, where the corpus reader
     * lives. Checking it here meant re-implementing frontmatter parsing, and
     * the copy disagreed with the reader about quoted values and where a fence
     * ends.
     *
     * No committed seed carries a `briefs` entry right now — the one that did
     * was a test post, deleted 2026-08-25 — so the corpus-wide assertions
     * above run against an empty set until an authored piece is committed.
     */
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
  describe('every seeded composition', () => {
    /**
     * WHICH DOCUMENT ARRAYS THESE RULES APPLY TO.
     *
     * Was `page.sections` alone, which meant the three rules below silently
     * skipped `collectionIndex`'s two arrays the day they existed (#347/#348):
     * a band there could name an unregistered `_type`, repeat a `_key`, or
     * omit the `surface` a `heroSection` at `variant: 'band'` really reads,
     * and nothing failed.
     *
     * `mayBeEmpty` is the one difference between them. A page with no sections
     * is a blank page and always a mistake; a collection index with an empty
     * `sectionsBelow` is an index that closes on its feed, which is a
     * composition someone may legitimately choose.
     *
     * The list is authored, and `covers every block-bearing document array`
     * below is what stops it drifting from the registry.
     */
    const COMPOSITIONS = [
      { type: 'page', field: 'sections', mayBeEmpty: false },
      { type: 'collectionIndex', field: 'sectionsAbove', mayBeEmpty: true },
      { type: 'collectionIndex', field: 'sectionsBelow', mayBeEmpty: true },
    ] as const

    /**
     * `caseStudy.story` is block-bearing and deliberately not here: it
     * interleaves section blocks with `chapter`, a shared object (ADR 0018),
     * so "only registered section blocks" is false of it by design. There are
     * no seeded case studies today — they are translated, not seeded — so the
     * exclusion costs no coverage.
     */
    const NOT_A_COMPOSITION = new Set(['caseStudy.story'])

    /** Every seeded array these rules cover, flattened, each with its address. */
    const compositions = seeds.flatMap(({ file, doc }) =>
      COMPOSITIONS.filter((entry) => entry.type === doc._type).map((entry) => ({
        file: `${file} → ${entry.field}`,
        mayBeEmpty: entry.mayBeEmpty,
        sections: (doc[entry.field] ?? []) as Record<string, unknown>[],
      })),
    )

    /**
     * Still page-only, and correctly so: the slug rule below is about a
     * routable document's URL, and a collection index deliberately has none —
     * the route owns its URL and finds the document by `collection`.
     */
    const pages = seeds.filter(({ doc }) => doc._type === 'page')

    it('has compositions to check', () => {
      expect(compositions.length).toBeGreaterThan(0)
      expect(pages.length).toBeGreaterThan(0)
    })

    /**
     * The registry is the source; this list is the mirror, so the mirror is
     * checked. A new block-bearing array on a DOCUMENT either joins
     * `COMPOSITIONS` or says why it cannot — otherwise it inherits the
     * silence this whole block was widened to remove.
     */
    it('covers every block-bearing document array in the registry', () => {
      const documentTypes = new Set(seeds.map(({ doc }) => doc._type as string))
      const declared = new Set(COMPOSITIONS.map((entry) => `${entry.type}.${entry.field}`))
      const hosted = Object.keys(BLOCK_ARRAYS).filter((key) =>
        documentTypes.has(key.split('.')[0]!),
      )

      for (const key of hosted) {
        if (NOT_A_COMPOSITION.has(key)) continue
        expect(declared, `${key} holds blocks and no seed rule covers it`).toContain(key)
      }
    })

    it('composes only registered section blocks — no bespoke types', () => {
      for (const { file, sections, mayBeEmpty } of compositions) {
        if (!mayBeEmpty) expect(sections.length, `${file} is empty`).toBeGreaterThan(0)
        for (const s of sections) {
          expect(
            SECTION_BLOCKS as readonly string[],
            `${file}: unregistered section "${String(s._type)}"`,
          ).toContain(s._type)
        }
      }
    })

    it('gives every section a _key unique within its array', () => {
      for (const { file, sections } of compositions) {
        const keys = sections.map((s) => s._key)
        expect(keys.every(Boolean), `${file} has a section with no _key`).toBe(true)
        expect(new Set(keys).size, `${file} repeats a section _key`).toBe(keys.length)
      }
    })

    // `surface` is injected by defineSectionBlock's initialValue, which only
    // runs in Studio — a loaded document has to carry it explicitly or every
    // section renders on the default surface.
    //
    // A section whose surface control the composition hides has no such field,
    // and storing one would be content nothing reads. `offersSurface` asks the
    // declaration section by section, so the day another band fixes its colour
    // — or gates the control — this test already knows.
    it('sets an explicit surface on every section that offers one', () => {
      for (const { file, sections } of compositions) {
        for (const s of sections) {
          if (!offersSurface(s)) {
            expect(s.surface, `${file}: ${String(s._type)} paints its own surface`).toBeUndefined()
            continue
          }
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
   * `reasons` or on the submit button's label is enforced for an editor and enforced by
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

    // The submit is an ordinary button instance, and a button with no label
    // renders nothing at all — so a form seeded without one has no submit.
    it('gives every form a submit button with words on it', () => {
      for (const { file, section } of forms) {
        const label = (section.button as { label?: unknown } | undefined)?.label
        expect(
          typeof label === 'string' && label.trim().length > 0,
          `${file}: formSection has no button label`,
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
    const CODE_ROUTES = new Set(['/', ...Object.values(collectionPrefixes())])

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
        const collection = Object.entries(collectionPrefixes()).find(([, prefix]) =>
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

    // The frame's order at both widths (`1680:2134`, `1814:1618`): the case
    // studies, the platforms rail, the pull quote, then the how-we-work track.
    // Figma is the source of record (map #33), so the seed follows it.
    it('follows the canonical Home frame’s section sequence', () => {
      expect(((home?.sections ?? []) as { _type: string }[]).map((s) => s._type)).toEqual([
        'heroSection',
        'logoWallSection',
        'caseShowcaseSection',
        'railPanelsSection',
        'quoteSection',
        'railPanelsSection',
        'insightsCarouselSection',
        'ctaSection',
      ])
    })
  })
})
