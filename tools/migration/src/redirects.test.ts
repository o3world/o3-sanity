import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { collectionPrefixes } from '@o3/sanity/brand'

import { GENERATED_REDIRECTS } from '../../../apps/web/src/lib/redirects.generated'
import { slugsByType } from './core/read'
import { EXTRACT_DIR } from './lib/paths'
import { movedPath } from './map/paths'

/**
 * The redirect table the app serves (#24), `apps/web/src/lib/redirects.generated.ts`,
 * held to the rules a hand edit could break — and then to the question the
 * ticket asks, against the live Yoast sitemaps snapshotted in
 * `data/extract/site/yoast-sitemaps.json`: does every URL the old site
 * advertised still resolve?
 */

/** Every path the new site serves, from the committed corpus's slugs. */
function sitePaths(): Set<string> {
  const bySlug = slugsByType()
  const prefixes = collectionPrefixes()
  const paths = new Set(['/', prefixes.caseStudy, prefixes.insight])
  for (const slug of bySlug.page ?? []) paths.add(slug === 'index' ? '/' : `/${slug}`)
  for (const slug of bySlug.insight ?? []) paths.add(`${prefixes.insight}/${slug}`)
  for (const slug of bySlug.caseStudy ?? []) paths.add(`${prefixes.caseStudy}/${slug}`)
  return paths
}

const redirects = GENERATED_REDIRECTS
const destinationBySource = new Map(redirects.map((r) => [r.source, r.destination]))
const paths = sitePaths()

/**
 * Where a request for `path` is sent: the first rule whose source matches,
 * taking a `:param` segment as any one segment, which is how Next.js reads
 * these sources. `undefined` when no rule claims the path.
 */
function resolve(path: string): string | undefined {
  const segments = path.split('/')
  const rule = redirects.find(({ source }) => {
    const pattern = source.split('/')
    return (
      pattern.length === segments.length &&
      pattern.every(
        (part, i) => part === segments[i] || (part.startsWith(':') && segments[i] !== ''),
      )
    )
  })
  return rule?.destination
}

describe('the committed redirect table', () => {
  it('holds the WordPress redirect map', () => {
    expect(redirects.length).toBeGreaterThan(200)
  })

  // "Redirect to the terminal, never to a redirect" (ADR 0013). A chain costs
  // a round trip and leaks the link equity it was built to keep.
  it('never points one redirect at another', () => {
    const chained = redirects.filter((r) => resolve(r.destination) !== undefined)
    expect(chained).toEqual([])
  })

  it('assigns each source exactly one destination', () => {
    expect(destinationBySource.size).toBe(redirects.length)
  })

  // Next.js compiles `source` as a path pattern; a space or a `%` in one is a
  // rule that either fails to build or matches nothing. `:param` segments are
  // Next's own syntax and are how a moved collection ships as one rule instead
  // of 272 (ADR 0017).
  it('holds only sources Next.js can match on', () => {
    for (const { source } of redirects) {
      expect(source, `${source} is not a plain path`).toMatch(/^\/[A-Za-z0-9/_.:-]*$/)
    }
  })

  /**
   * A parameterized rule matches everything under its prefix, so anything more
   * specific has to be declared before it — Next.js takes the first match.
   * Three retired articles redirect to the index rather than to their own new
   * path, and if the wildcard outranked them those visitors would land on a
   * 404 instead.
   */
  it('declares every specific row before the wildcard that would swallow it', () => {
    for (const [i, { source }] of redirects.entries()) {
      if (!source.includes(':')) continue
      const prefix = source.slice(0, source.indexOf('/:'))
      const shadowed = redirects
        .slice(i + 1)
        .filter((r) => r.source !== source && r.source.startsWith(`${prefix}/`))
      expect(
        shadowed.map((r) => r.source),
        `${source} shadows rows declared after it`,
      ).toEqual([])
    }
  })

  /**
   * o3xo.ai is where O3's AI writing lives, and a post that moved there keeps
   * its rule permanently. These seven never made it to o3xo.ai, so a rule
   * sending them there lands on its 404. With no rule of their own they take
   * the `/perspectives/:slug` move to the copy this site publishes (OWSW-39).
   */
  it('keeps the posts o3xo.ai never took on this site', () => {
    const kept = [
      'ai-roi-beyond-efficiency',
      'decoding-openai-turmoil-o3-insights-ai-governance-industry-implications',
      'mike-gadsby-on-pacts-digital-phorum-podcast',
      'navigating-the-ai-revolution-a-recap-of-pact-tech-series-on-ai-in-fintech',
      'revolutionizing-healthcare-a-deep-dive-into-o3s-ai-webinar',
      'rfp-automation-case-study',
      'the-ceos-guide-to-ai-integration-10-common-questions-to-consider',
    ]
    for (const slug of kept) {
      expect(destinationBySource.has(`/perspectives/${slug}`), slug).toBe(false)
      expect(movedPath(`/perspectives/${slug}`)).toBe(`/insights/${slug}`)
    }
  })

  /**
   * Case studies the redesign did not carry over, and the old partnerships
   * page, which has no successor. Their fixtures stay committed under
   * `data/translated/`, so `sitePaths()` counts them as served; production does
   * not publish them, and without these rules each is a 404 (OWSW-39).
   */
  it('retires the unmigrated case studies to the work index and partnerships to about', () => {
    const retired = [
      'ai-powered-personalization',
      'allied-pixel',
      'amerigas',
      'college-hunks',
      'eseo-sports',
      'fimc',
      'gettacar',
      'healthcare-innovation',
      'la-colombe',
      'linode',
      'personalized-video',
      'scarlet-ai-hyper-personalizing-creative-gig-economy',
      'sei-advice',
      'sei-ampere',
      'the-institutes',
    ]
    for (const slug of retired) {
      expect(destinationBySource.get(`/work/${slug}`), `/work/${slug}`).toBe('/work')
    }
    expect(destinationBySource.get('/partnerships')).toBe('/about')
  })

  /**
   * Old WordPress URLs that drew requests after launch with no rule to catch
   * them (#536): Yoast's sitemaps, the RSS feed, team pages the map never
   * named one by one, and a case-study slug the production insight
   * `rfp-automation-case-study` still links to.
   */
  it('catches the old URLs that 404ed after launch', () => {
    const expected = {
      '/sitemap_index.xml': '/sitemap.xml',
      '/page-sitemap.xml': '/sitemap.xml',
      '/post-sitemap.xml': '/sitemap.xml',
      '/services-sitemap.xml': '/sitemap.xml',
      '/ventures-sitemap.xml': '/sitemap.xml',
      '/work-sitemap.xml': '/sitemap.xml',
      '/feed': '/insights',
      '/about/team': '/about',
      '/about/team/alan-cho': '/about',
      '/about/team/matt-schaff': '/about',
      '/about/people/jamie-reutzel': '/about',
      '/work/rfp-automation': resolve('/work/rfp-automation-o3'),
    }
    const actual = Object.fromEntries(Object.keys(expected).map((path) => [path, resolve(path)]))
    expect(actual).toEqual(expected)
    expect(expected['/work/rfp-automation']).toMatch(/^https:\/\//)
  })

  it('leaves the pages those rules send people to alone', () => {
    for (const path of ['/sitemap.xml', '/about', '/insights', '/about/people']) {
      expect(resolve(path), path).toBeUndefined()
    }
  })

  // A self-redirect is an infinite loop in production.
  it('holds no rule that redirects a path to itself', () => {
    for (const { source, destination } of redirects) {
      expect(destination, `${source} redirects to itself`).not.toBe(source)
    }
  })

  /**
   * Every URL the live Yoast sitemaps advertise is either a path this site
   * serves or a path it redirects. There is no third answer — a gap here is a
   * 404 with inbound links pointing at it.
   */
  describe('against the live Yoast sitemaps', () => {
    const snapshot = JSON.parse(
      readFileSync(join(EXTRACT_DIR, 'site', 'yoast-sitemaps.json'), 'utf8'),
    ) as { sitemaps: Record<string, string[]> }
    const live = Object.values(snapshot.sitemaps).flat()

    it('snapshots all five sitemaps', () => {
      expect(Object.keys(snapshot.sitemaps).sort()).toEqual([
        'page',
        'post',
        'services',
        'ventures',
        'work',
      ])
      expect(live.length).toBeGreaterThan(300)
    })

    it('serves or redirects every URL the live site advertises', () => {
      const gaps = live.filter(
        (url) => !paths.has(url) && !destinationBySource.has(url) && movedPath(url) === null,
      )
      expect(gaps).toEqual([])
    })

    /**
     * ADR 0017's cost, stated rather than absorbed, so the number cannot creep:
     * a future rename that moved another collection shows up here as a change,
     * not as a quiet re-tabulation.
     */
    it('moves exactly the URLs ADR 0017 said it would', () => {
      // 273 live URLs sit under the old prefix; 23 of them redirect somewhere
      // explicit — 20 to o3xo.ai, which shadows those posts, and 3 to the index
      // because the article is no longer published. The other 250 take the
      // collection's 301 to their new address, which is the figure
      // docs/seo-parity.md reports and the whole cost of the rename.
      const underOldPrefix = live.filter((url) => !paths.has(url) && movedPath(url) !== null)
      expect(underOldPrefix.every((url) => url.startsWith('/perspectives'))).toBe(true)

      const alreadyRedirected = underOldPrefix.filter((url) => destinationBySource.has(url))
      expect(alreadyRedirected).toHaveLength(23)
      expect(underOldPrefix.length - alreadyRedirected.length).toBe(250)
    })

    /**
     * The other direction. A path this site serves that no live sitemap lists
     * is greenfield — fine, and worth naming, because the alternative reading
     * is "a slug changed shape during migration", which path parity exists to
     * stop. A `/work/*` path the live site has never heard of is a case study
     * nobody wrote.
     */
    it('adds only the greenfield paths that are meant to be new', () => {
      // A live URL this redesign moved is not greenfield — it is the same
      // document at the address ADR 0017 gave it. Comparing against the moved
      // set rather than the raw sitemap keeps this list about new *content*.
      const liveSet = new Set(live.map((url) => movedPath(url) ?? url))
      const added = [...paths].filter((p) => !liveSet.has(p)).sort()
      expect(added).toEqual([
        '/live',
        // The partner landing pages (#92). Sanity has the canonical frame
        // (`2354:2446`); Vercel and Lovable follow its composition. WordPress
        // served none of the three.
        '/partners/lovable',
        '/partners/sanity',
        '/partners/vercel',
        // The first service landing page (#93) — frame `2360:2879`, a
        // standalone page under /solutions/. WordPress's service pages 301
        // into /solutions; this slug is new content, not a move.
        '/solutions/software-engineering',
      ])
    })
  })
})
