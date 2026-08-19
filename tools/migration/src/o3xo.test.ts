import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { brandConfig } from '@o3/sanity/brand'
import { SECTION_BLOCKS } from '@o3/sanity/schemas/registry'

import { refsIn } from './lib/corpus'
import { dataRoot } from './lib/paths'
import { categoryDoc } from './map/category'
import { caseStudyDoc } from './map/caseStudy'
import { clientDoc } from './map/framerCaseStudy'
import { insightDoc } from './map/insight'
import { checkPathParity } from './map/paths'
import type { FramerInsightRecord } from './map/framer'

/**
 * Invariants over the committed **O3XO** corpus.
 *
 * The other corpus tests here read the constants in `lib/paths.ts`, which
 * resolve to whichever brand the run named — under vitest, o3. This file names
 * the other brand explicitly, so both corpora are checked by one `pnpm test`
 * rather than only the one that happens to be the default.
 *
 * It is deliberately not a copy of `converted.test.ts` and `seed.test.ts`. Their
 * rules are about o3's content — the homepage's section sequence, the contact
 * form, the byline directory — and none of them is a fact about O3XO. What both
 * corpora share is the contract: deterministic ids, honest provenance, gates
 * that pass, references that resolve, and a path that matches the live site.
 */

type AnyDoc = { _id: string; _type: string; [key: string]: unknown }

const ROOT = dataRoot('o3xo')

function readTree(tree: string): { file: string; doc: AnyDoc }[] {
  const root = join(ROOT, tree)
  if (!existsSync(root)) return []
  const out: { file: string; doc: AnyDoc }[] = []
  for (const type of readdirSync(root)) {
    const dir = join(root, type)
    for (const name of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
      out.push({
        file: `${tree}/${type}/${name}`,
        doc: JSON.parse(readFileSync(join(dir, name), 'utf8')) as AnyDoc,
      })
    }
  }
  return out
}

const converted = readTree('converted')
const seeds = readTree('seed')
const all = [...converted, ...seeds]

const insights = all.filter(({ doc }) => doc._type === 'insight')
const categories = all.filter(({ doc }) => doc._type === 'category')
const provenance = (doc: AnyDoc) =>
  (doc.migration ?? {}) as {
    locked?: boolean
    sourceId?: string
    provisional?: boolean
    provisionalNote?: string
  }

describe('the committed O3XO corpus', () => {
  it('has documents to check (a silently empty corpus would pass everything below)', () => {
    expect(all.length).toBeGreaterThan(0)
    expect(insights.length).toBeGreaterThan(0)
  })

  it('assigns every document a unique _id', () => {
    const ids = all.map(({ doc }) => doc._id)
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([])
  })

  it('validates every insight against the same gate o3 insights pass', () => {
    for (const { file, doc } of insights) {
      const parsed = insightDoc.safeParse(doc)
      expect(parsed.success, `${file}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
    }
  })

  it('validates every category against its gate', () => {
    for (const { file, doc } of categories) {
      expect(categoryDoc.safeParse(doc).success, file).toBe(true)
    }
  })

  /**
   * `<type>-<source>-<key>`: `framer` for a document migrated from o3xo.ai,
   * `seed` for one written here. Deterministic ids are what make "wipe and
   * rebuild reproduces the dataset" true (ADR 0003) — and `load` retires by the
   * same contract, so an id outside it is a document nothing will ever clean up.
   */
  it('gives every document a deterministic id naming its source', () => {
    for (const { file, doc } of all) {
      // The one singleton: `siteSettings` has no id of its own in either brand.
      if (doc._id === 'siteSettings') continue
      expect(doc._id, file).toMatch(new RegExp(`^${doc._type}-(framer|seed)-[a-z0-9-]+$`))
    }
  })

  it('records provenance naming the source on every document', () => {
    for (const { file, doc } of all) {
      expect(provenance(doc).sourceId, file).toMatch(
        /^(framer:(insight|category|caseStudy|client|page|person):.+|framer:siteSettings|seed:.+)$/,
      )
    }
  })

  it('leaves every document unlocked, so its own pipeline can rewrite it', () => {
    for (const { file, doc } of all) {
      expect(provenance(doc).locked, file).toBe(false)
    }
  })

  it('makes every provisional document say what would replace it', () => {
    for (const { file, doc } of all) {
      const { provisional, provisionalNote } = provenance(doc)
      if (provisional === undefined) continue
      expect(typeof provisional, `${file} sets a non-boolean provisional`).toBe('boolean')
      if (provisional) expect(provisionalNote?.trim(), file).toBeTruthy()
    }
  })

  // A dangling reference loads without complaint and renders as a hole.
  it('resolves every reference to another committed O3XO document', () => {
    const ids = new Set(all.map(({ doc }) => doc._id))
    for (const { file, doc } of all) {
      for (const ref of refsIn(doc)) {
        expect(ids, `${file} references ${ref}, which is not committed`).toContain(ref)
      }
    }
  })

  it('never lets two documents of one type claim the same slug', () => {
    const seen = new Map<string, string>()
    for (const { file, doc } of all) {
      const slug = (doc.slug as { current?: string } | undefined)?.current
      if (!slug) continue
      const key = `${doc._type}:${slug}`
      expect(seen.get(key), `${file} and ${seen.get(key)} both claim ${key}`).toBeUndefined()
      seen.set(key, file)
    }
  })

  /**
   * The source token is not decoration. o3xo.ai is a Framer site and has never
   * had a WordPress upload, so a `_wpSrc` in this corpus means a mapper was
   * copied rather than written and the marker's promise — that it names where
   * the bytes come from (`map/types.ts`) — has already been broken.
   */
  it('carries no WordPress marker anywhere', () => {
    for (const { file, doc } of all) {
      expect(JSON.stringify(doc), file).not.toContain('_wpSrc')
    }
  })

  /**
   * Framer serves every size of one picture off the same path with a different
   * resize query, so a marker that kept the query would upload the same
   * photograph once per srcset entry and store a downscale as the original.
   */
  it('points every image marker at a full-size original, with no resize query', () => {
    for (const { file, doc } of all) {
      for (const marker of JSON.stringify(doc).match(/"_srcUrl":"[^"]+"/g) ?? []) {
        expect(marker, `${file} migrates a resized image`).not.toContain('?')
      }
    }
  })

  it('emits only body block types the bodyText schema allows', () => {
    const allowed = new Set(['block', 'figure', 'embed', 'pullQuote'])
    for (const { file, doc } of insights) {
      for (const block of doc.body as { _type: string }[]) {
        expect(allowed, `${file} has an unexpected block "${block._type}"`).toContain(block._type)
      }
    }
  })

  it('gives every body block a _key unique within its document', () => {
    for (const { file, doc } of insights) {
      const keys = (doc.body as { _key?: string }[]).map((block) => block._key)
      expect(keys.every(Boolean), `${file} has a body block with no _key`).toBe(true)
      expect(new Set(keys).size, `${file} has duplicate body _keys`).toBe(keys.length)
    }
  })

  /**
   * Path parity (#26), re-checked against the committed extract so a
   * hand-edited slug is caught too: an insight has to be served at the path
   * o3xo.ai serves it at today, or the URL silently changes on cutover.
   */
  it('serves every insight at the path o3xo.ai serves it at', () => {
    const { collections } = brandConfig('o3xo')
    let checked = 0
    for (const { file, doc } of insights) {
      const extract = join(ROOT, 'extract', 'insight', file.split('/').pop()!)
      if (!existsSync(extract)) continue
      const record = JSON.parse(readFileSync(extract, 'utf8')) as FramerInsightRecord
      const slug = (doc.slug as { current: string }).current
      const issue = checkPathParity(
        record.seo.canonicalRendered,
        `${collections.insight.prefix}/${slug}`,
        'o3xo.ai',
      )
      expect(issue?.detail, file).toBeUndefined()
      checked++
    }
    expect(checked, 'no insight was checked — wrong extract directory?').toBeGreaterThan(0)
  })

  /**
   * The whole insight collection (#218). o3xo.ai's sitemap lists **40** article
   * URLs — the 41 in this ticket's title counts the `/insights` index among
   * them, which is a route rather than a document — and all 40 are here.
   */
  describe('every migrated insight', () => {
    /** The extract record beside a converted document: its ordering evidence. */
    function extractFor(file: string): FramerInsightRecord | null {
      const path = join(ROOT, 'extract', 'insight', file.split('/').pop()!)
      return existsSync(path)
        ? (JSON.parse(readFileSync(path, 'utf8')) as FramerInsightRecord)
        : null
    }

    it('has one document per article the sitemap lists', () => {
      expect(insights.length).toBe(40)
      const counts = new Set(insights.map(({ file }) => extractFor(file)?.sitemapCount))
      expect(counts, 'the extract disagrees about how many articles the sitemap listed').toEqual(
        new Set([40]),
      )
    })

    /**
     * The site publishes no date, so `publishedAt` is **synthetic**: derived
     * from the sitemap position, which is the only ordering evidence there is
     * (`map/framer.ts`). What matters is that it is complete, unique, and in the
     * site's own order — `order(publishedAt desc)` is how every feed and the
     * index read the collection.
     */
    it('dates every insight, and no two the same', () => {
      const dates = insights.map(({ doc }) => doc.publishedAt as string)
      expect(dates.every((date) => typeof date === 'string')).toBe(true)
      expect(new Set(dates).size).toBe(dates.length)
    })

    it('orders the collection the way the sitemap lists it', () => {
      const byPosition = insights
        .map(({ file, doc }) => ({
          position: extractFor(file)?.sitemapPosition ?? 0,
          publishedAt: doc.publishedAt as string,
        }))
        .sort((a, b) => a.position - b.position)

      expect(byPosition.map(({ position }) => position)).toEqual(
        Array.from({ length: 40 }, (_, i) => i + 1),
      )
      // First listed is newest, so the dates descend as the positions ascend.
      for (const [i, entry] of byPosition.entries()) {
        if (i === 0) continue
        expect(
          entry.publishedAt < byPosition[i - 1]!.publishedAt,
          `position ${entry.position} is not older than ${byPosition[i - 1]!.position}`,
        ).toBe(true)
      }
    })

    /** Roughly a year, which is what the synthesis was asked for. */
    it('spreads the collection over about a year', () => {
      const dates = insights.map(({ doc }) => Date.parse(doc.publishedAt as string)).sort()
      const days = (dates.at(-1)! - dates[0]!) / 86_400_000
      expect(days).toBeGreaterThan(300)
      expect(days).toBeLessThan(400)
    })

    /**
     * Body links to o3xo.ai's own pages are absolute on the source site and are
     * migrated as written — relativising them is the launch-cutover audit's job
     * (#223), and this pins that nothing here quietly did it early.
     */
    it('keeps a self-link exactly as the source wrote it', () => {
      const withSelfLinks = insights.filter(({ doc }) =>
        JSON.stringify(doc.body).includes('https://www.o3xo.ai/'),
      )
      expect(withSelfLinks.length).toBeGreaterThan(0)
    })
  })

  /**
   * The O3XO singleton is o3xo.ai's own chrome, not the WordPress chrome
   * extract, so `siteSettingsDoc` does not describe it (see `verify.ts`). What
   * the chrome renders is asserted here instead — a settings document missing
   * one of these renders a nav with no links or a footer with nothing in it,
   * and nothing else in the pipeline would say so.
   */
  describe('the site settings singleton', () => {
    const settings = all.find(({ doc }) => doc._type === 'siteSettings')?.doc

    it('exists at the id the chrome query fetches', () => {
      expect(settings?._id).toBe('siteSettings')
    })

    it('gives the chrome a title, nav links and the footer’s three lines', () => {
      expect(settings?.title).toBeTruthy()
      expect((settings?.navItems as unknown[] | undefined)?.length).toBeGreaterThan(0)
      expect(settings?.footerTagline).toBeTruthy()
      // No `footerGroups`: the kit's `Footer` (`4404:4148`) draws no link
      // columns, so the one the bootstrap invented has no reader (#243). The
      // footer's row is `utilityNavItems` + `legalLinks`, both asserted below.
      expect(settings).not.toHaveProperty('footerGroups')
      expect((settings?.utilityNavItems as unknown[] | undefined)?.length).toBeGreaterThan(0)
    })

    /** The three the hand-seeded bootstrap could not carry (#217, #220). */
    it('names the entity behind the site, its socials and its small print', () => {
      expect(settings?.legalName).toBe('O3 World, LLC')
      expect((settings?.socialLinks as unknown[] | undefined)?.length).toBeGreaterThan(0)
      expect((settings?.legalLinks as unknown[] | undefined)?.length).toBeGreaterThan(0)
    })
  })

  /**
   * The case studies (#219). o3xo.ai publishes six, at six URLs, and the model
   * carries them whole: the client the collection index names, the two authored
   * chapters, the results figure and — on five of the six — the client quote.
   */
  describe('every migrated case study', () => {
    const caseStudies = all.filter(({ doc }) => doc._type === 'caseStudy')
    const clients = all.filter(({ doc }) => doc._type === 'client')

    it('has the whole published collection, and no redirect junk', () => {
      expect(
        caseStudies.map(({ doc }) => (doc.slug as { current: string }).current).sort(),
      ).toEqual([
        'buffalo-construction',
        'e-hazard',
        'fortune-500-insurance-provider',
        'global-tech-firm',
        'healthcare-tech-leader',
        'tyndale',
      ])
    })

    it('validates every one against the same gate o3 case studies pass', () => {
      for (const { file, doc } of caseStudies) {
        const parsed = caseStudyDoc.safeParse(doc)
        expect(parsed.success, `${file}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
      }
    })

    it('validates every client it names', () => {
      expect(clients.length).toBe(caseStudies.length)
      for (const { file, doc } of clients) {
        const parsed = clientDoc.safeParse(doc)
        expect(parsed.success, `${file}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
      }
    })

    /**
     * The narrative is one interleaved array (ADR 0018), and every member of it
     * is either a chapter or a registered section block — a bespoke `_type`
     * here would load into a document nothing can render.
     */
    it('builds the story from chapters and registered blocks only', () => {
      for (const { file, doc } of caseStudies) {
        const story = (doc.story ?? []) as { _type: string; _key?: string }[]
        expect(story.length, `${file} has no story`).toBeGreaterThan(0)
        for (const member of story) {
          if (member._type === 'chapter') continue
          expect(
            SECTION_BLOCKS as readonly string[],
            `${file}: unregistered story member "${member._type}"`,
          ).toContain(member._type)
        }
        const keys = story.map((member) => member._key)
        expect(keys.every(Boolean), `${file} has a story member with no _key`).toBe(true)
        expect(new Set(keys).size, `${file} repeats a story _key`).toBe(keys.length)
      }
    })

    it('serves every case study at the path o3xo.ai serves it at', () => {
      const { collections } = brandConfig('o3xo')
      let checked = 0
      for (const { file, doc } of caseStudies) {
        const extract = join(ROOT, 'extract', 'caseStudy', file.split('/').pop()!)
        if (!existsSync(extract)) continue
        const record = JSON.parse(readFileSync(extract, 'utf8')) as {
          seo: { canonicalRendered: string }
        }
        const slug = (doc.slug as { current: string }).current
        const issue = checkPathParity(
          record.seo.canonicalRendered,
          `${collections.caseStudy.prefix}/${slug}`,
          'o3xo.ai',
        )
        expect(issue?.detail, file).toBeUndefined()
        checked++
      }
      expect(checked, 'no case study was checked — wrong extract directory?').toBe(
        caseStudies.length,
      )
    })
  })

  describe('every page', () => {
    const pages = all.filter(({ doc }) => doc._type === 'page')

    it('has pages to check', () => {
      expect(pages.length).toBeGreaterThan(0)
    })

    /**
     * Every non-collection URL o3xo.ai's sitemap lists resolves on `apps/o3xo`
     * — which, for a catch-all route, means a `page` document claims its slug
     * (#220). The homepage's is `index`, which is what the singleton route
     * fetches.
     */
    it('claims every non-collection URL the live sitemap serves', () => {
      const slugs = new Set(pages.map(({ doc }) => (doc.slug as { current: string }).current))
      for (const slug of [
        'index',
        'about',
        'about/approach',
        'contact',
        'industries',
        'industries/construction',
        'industries/technology',
        'industries/industrial-services',
        'industries/life-sciences',
        'industries/real-estate',
        'industries/finance-insurance',
      ]) {
        expect(slugs, `no page claims ${slug}`).toContain(slug)
      }
    })

    it('composes only registered section blocks — no bespoke types', () => {
      for (const { file, doc } of pages) {
        const sections = (doc.sections ?? []) as { _type: string; _key?: string }[]
        expect(sections.length, `${file} has no sections`).toBeGreaterThan(0)
        for (const section of sections) {
          expect(
            SECTION_BLOCKS as readonly string[],
            `${file}: unregistered section "${section._type}"`,
          ).toContain(section._type)
        }
      }
    })

    it('gives every section a _key unique within the page', () => {
      for (const { file, doc } of pages) {
        const keys = ((doc.sections ?? []) as { _key?: string }[]).map((section) => section._key)
        expect(keys.every(Boolean), `${file} has a section with no _key`).toBe(true)
        expect(new Set(keys).size, `${file} repeats a section _key`).toBe(keys.length)
      }
    })
  })
})
