import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { slugsByType } from '../core/read'
import type { WpRedirectExport } from '../lib/redirects'
import { EXTRACT_DIR, REPO_ROOT } from '../lib/paths'
import { movedPath } from './paths'
import {
  ADR_0013_CHAIN_TERMINALS,
  ADR_0013_SERVICE_TERMINALS,
  buildRedirectMap,
  normalizePath,
  sitePaths,
  UNREDIRECTED_LIVE_URLS,
} from './redirects'

/**
 * The redirect map (#24).
 *
 * Two layers, and they fail differently. The unit cases pin the rules that
 * one bad row would otherwise break quietly — a query-string source becoming
 * a redirect on `/`, a three-hop chain shipping as three hops. The corpus
 * checks run the real committed export through the real builder and ask the
 * question the ticket asks: does every URL the live site advertises still
 * resolve?
 */

const GENERATED = join(REPO_ROOT, 'apps/web/src/lib/redirects.generated.ts')

function anExport(over: Partial<WpRedirectExport> = {}): WpRedirectExport {
  return {
    home: 'http://www.o3world.com',
    redirection: [],
    yoastPlain: {},
    yoastRegex: {},
    ...over,
  }
}

function aRow(source: string, target: string | null, over: Record<string, string> = {}) {
  return { source, target, code: '301', regex: '0', status: 'enabled', group_name: 'R', ...over }
}

describe('normalizePath', () => {
  it('gives every path a leading slash and no trailing one', () => {
    expect(normalizePath('services/foo/')).toBe('/services/foo')
    expect(normalizePath('/services/foo')).toBe('/services/foo')
  })

  it('keeps the root a root rather than an empty string', () => {
    expect(normalizePath('/')).toBe('/')
  })

  it('leaves an absolute URL alone — it is somebody else’s path space', () => {
    expect(normalizePath('https://www.o3xo.ai/insights/foo/')).toBe(
      'https://www.o3xo.ai/insights/foo/',
    )
  })

  it('returns null for nothing', () => {
    expect(normalizePath('')).toBeNull()
    expect(normalizePath(null)).toBeNull()
  })
})

describe('buildRedirectMap', () => {
  const paths = sitePaths({
    pageSlugs: ['index', 'about', 'solutions'],
    insightSlugs: ['live-one'],
    caseStudySlugs: [],
  })

  /**
   * Every call also emits ADR 0013's tables and the hand-decided URLs, which
   * are inputs rather than fixtures — so a case asserts about the rows its own
   * fixture produced, not about the whole list.
   */
  const seeded = new Set(
    buildRedirectMap({ wp: anExport(), sitePaths: paths }).redirects.map((r) => r.source),
  )
  const only = (result: { redirects: readonly { source: string; destination: string }[] }) =>
    result.redirects.filter((r) => !seeded.has(r.source))
  const dropReason = (
    result: { dropped: readonly { source: string; reason: string }[] },
    source: string,
  ) => result.dropped.find((d) => d.source === source)?.reason

  it('collapses a chain to its terminal rather than rebuilding the hops', () => {
    const result = buildRedirectMap({
      wp: anExport({
        redirection: [aRow('/a/', '/b/'), aRow('/b/', '/c/'), aRow('/c/', '/about/')],
      }),
      sitePaths: paths,
    })
    expect(only(result).map((r) => [r.source, r.destination])).toEqual([
      ['/a', '/about'],
      ['/b', '/about'],
      ['/c', '/about'],
    ])
  })

  /**
   * The regression this rule exists for. Redirection stores the query string
   * on `url` and strips it into `match_url`, and the live site has exactly one
   * such row: `/?resource_type=ebook` → a PDF. Reading `match_url` turns a
   * dead ebook link into a permanent redirect off the homepage.
   */
  it('never turns a query-string rule into a pathname redirect', () => {
    const result = buildRedirectMap({
      wp: anExport({ redirection: [aRow('/?resource_type=ebook', '/about/')] }),
      sitePaths: paths,
    })
    expect(only(result)).toEqual([])
    expect(dropReason(result, '/?resource_type=ebook')).toMatch(/query string/)
  })

  it('drops a rule whose destination this site does not serve', () => {
    const result = buildRedirectMap({
      wp: anExport({ redirection: [aRow('/old', '/a-page-that-was-never-migrated')] }),
      sitePaths: paths,
    })
    expect(only(result)).toEqual([])
    expect(dropReason(result, '/old')).toMatch(/nothing serves/)
  })

  // A redirect on a URL this site serves would hide the page for the sake of
  // a rule the old site needed and this one does not.
  it('refuses to shadow a live page with an internal redirect', () => {
    const result = buildRedirectMap({
      wp: anExport({ redirection: [aRow('/insights/live-one', '/about')] }),
      sitePaths: paths,
    })
    expect(only(result)).toEqual([])
    expect(dropReason(result, '/insights/live-one')).toMatch(/shadow/)
  })

  // …but an external one may, and 32 real rows do: the post is still in
  // WordPress while its URL 301s to o3xo.ai, where the content now lives.
  it('lets an external redirect shadow a live page, and marks it external', () => {
    const result = buildRedirectMap({
      wp: anExport({
        redirection: [aRow('/insights/live-one', 'https://www.o3xo.ai/insights/live-one/')],
      }),
      sitePaths: paths,
    })
    expect(only(result)).toHaveLength(1)
    expect(result.external.some((r) => r.source === '/insights/live-one')).toBe(true)
  })

  it('answers a 410 with nothing rather than a redirect into a 404', () => {
    const result = buildRedirectMap({
      wp: anExport({ yoastPlain: { gone: { url: '', type: 410 } } }),
      sitePaths: paths,
    })
    expect(only(result)).toEqual([])
    expect(dropReason(result, '/gone')).toMatch(/410/)
  })

  it('survives a loop in the source data', () => {
    const result = buildRedirectMap({
      wp: anExport({ redirection: [aRow('/a', '/b'), aRow('/b', '/a')] }),
      sitePaths: paths,
    })
    expect(only(result)).toEqual([])
    expect(dropReason(result, '/a')).toMatch(/loops/)
    expect(dropReason(result, '/b')).toMatch(/loops/)
  })

  // ADR 0013 overrides WordPress's own answer, because WordPress's answer is a
  // pair of landing pages this redesign deletes.
  it('takes ADR 0013’s terminal over the chain WordPress walks', () => {
    const { redirects } = buildRedirectMap({
      wp: anExport({
        redirection: [
          aRow('/services/ux-audit', '/solutions/conversion-rate-optimization-consultant'),
        ],
      }),
      sitePaths: paths,
    })
    expect(redirects.find((r) => r.source === '/services/ux-audit')?.destination).toBe('/solutions')
  })

  // Three of the 24 and both landing pages still serve their own page, so the
  // export has no row for them — and they are indexed.
  it('emits an ADR 0013 URL that WordPress never redirected', () => {
    const { redirects } = buildRedirectMap({ wp: anExport(), sitePaths: paths })
    expect(redirects.find((r) => r.source === '/services/benchmark-surveys')?.destination).toBe(
      '/solutions',
    )
  })
})

describe('ADR 0013’s tables', () => {
  // The ADR is the decision; these constants are its executable copy. Counts
  // are checked so a row cannot be dropped from one without the other.
  it('carries the 24 service URLs the ADR counted', () => {
    expect(Object.keys(ADR_0013_SERVICE_TERMINALS)).toHaveLength(24)
  })

  it('carries the 9 chain URLs the ADR counted', () => {
    expect(Object.keys(ADR_0013_CHAIN_TERMINALS)).toHaveLength(9)
  })

  it('sends everything to /solutions bar the two the ADR names', () => {
    const elsewhere = Object.entries({
      ...ADR_0013_SERVICE_TERMINALS,
      ...ADR_0013_CHAIN_TERMINALS,
    }).filter(([, to]) => to !== '/solutions')
    expect(elsewhere.map(([from]) => from).sort()).toEqual([
      '/services/ai-consulting',
      '/services/experience-design',
      '/transcend',
    ])
  })
})

/**
 * The committed corpus, run through the real builder — and then the question
 * the ticket actually asks, against the live Yoast sitemaps snapshotted in
 * `data/extract/site/yoast-sitemaps.json`.
 */
describe('the committed redirect map', () => {
  const wp = JSON.parse(
    readFileSync(join(EXTRACT_DIR, 'site', 'redirects.json'), 'utf8'),
  ) as WpRedirectExport

  const bySlug = slugsByType()
  const paths = sitePaths({
    pageSlugs: bySlug.page ?? [],
    insightSlugs: bySlug.insight ?? [],
    caseStudySlugs: bySlug.caseStudy ?? [],
  })
  const map = buildRedirectMap({ wp, sitePaths: paths })
  const destinationBySource = new Map(map.redirects.map((r) => [r.source, r.destination]))

  it('reads a real export', () => {
    expect(wp.redirection.length).toBeGreaterThan(200)
    expect(map.redirects.length).toBeGreaterThan(200)
  })

  /**
   * `next.config.ts` imports the generated file, not this package — the
   * pipeline is deleted when the migration ships. So the committed artifact
   * has to still be what the generator produces, or the site is serving a
   * redirect table nobody can reproduce.
   */
  it('matches the file the app actually serves', () => {
    const generated = readFileSync(GENERATED, 'utf8')
    const sources = [...generated.matchAll(/source:\s*'([^']*)'/g)].map((m) => m[1]!)
    const destinations = [...generated.matchAll(/destination:\s*'([^']*)'/g)].map((m) => m[1]!)
    expect(sources).toEqual(map.redirects.map((r) => r.source))
    expect(destinations).toEqual(map.redirects.map((r) => r.destination))
  })

  // "Redirect to the terminal, never to a redirect" (ADR 0013). A chain costs
  // a round trip and leaks the link equity it was built to keep.
  it('never points one redirect at another', () => {
    const chained = map.redirects.filter((r) => destinationBySource.has(r.destination))
    expect(chained).toEqual([])
  })

  it('assigns each source exactly one destination', () => {
    expect(destinationBySource.size).toBe(map.redirects.length)
  })

  // Next.js compiles `source` as a path pattern; a space or a `%` in one is a
  // rule that either fails to build or matches nothing. `:param` segments are
  // Next's own syntax and are how a moved collection ships as one rule instead
  // of 272 (ADR 0017).
  it('emits only sources Next.js can match on', () => {
    for (const { source } of map.redirects) {
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
    for (const [i, { source }] of map.redirects.entries()) {
      if (!source.includes(':')) continue
      const prefix = source.slice(0, source.indexOf('/:'))
      const shadowed = map.redirects
        .slice(i + 1)
        .filter((r) => r.source !== source && r.source.startsWith(`${prefix}/`))
      expect(
        shadowed.map((r) => r.source),
        `${source} shadows rows declared after it`,
      ).toEqual([])
    }
  })

  /**
   * A self-redirect is an infinite loop in production, so the generator throws
   * on one rather than dropping it quietly. The rename creates exactly one —
   * WordPress's `/insights` → `/perspectives` row, whose destination ADR 0017
   * moved back onto its own source.
   */
  it('ships no rule that redirects a path to itself', () => {
    for (const { source, destination } of map.redirects) {
      expect(destination, `${source} redirects to itself`).not.toBe(source)
    }
  })

  /**
   * The ticket's second acceptance criterion, mechanised: every URL the live
   * Yoast sitemaps advertise is either a path this site serves or a path it
   * redirects. There is no third answer — a gap here is a 404 with inbound
   * links pointing at it.
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
     * ADR 0017's cost, stated rather than absorbed. Before it, 243 of the 272
     * post URLs resolved at the identical path and this number was 0. They now
     * 301, which is a real if modest SEO expense, and the point of asserting
     * it is that the number cannot creep: a future rename that moved another
     * collection would show up here as a change, not as a quiet re-tabulation.
     */
    it('moves exactly the URLs ADR 0017 said it would', () => {
      // 273 live URLs sit under the old prefix; 30 of them already redirected
      // somewhere explicit — 27 to o3xo.ai, which shadows those posts, and 3
      // to the index because the article is no longer published. The other
      // 243 are the ones that used to resolve at their own address and now
      // take a 301 instead. That is exactly the figure docs/seo-parity.md
      // reported as "served at the same path", and it is the whole cost of
      // this rename.
      const underOldPrefix = live.filter((url) => !paths.has(url) && movedPath(url) !== null)
      expect(underOldPrefix.every((url) => url.startsWith('/perspectives'))).toBe(true)

      const alreadyRedirected = underOldPrefix.filter((url) => destinationBySource.has(url))
      expect(alreadyRedirected).toHaveLength(30)
      expect(underOldPrefix.length - alreadyRedirected.length).toBe(243)
    })

    /**
     * The other direction. A path this site serves that no live sitemap lists
     * is greenfield — fine, and worth naming, because the alternative reading
     * is "a slug changed shape during migration", which `checkPathParity`
     * exists to stop.
     *
     * It was five until ADR 0016. `/work/aramark`, `/work/chop` and
     * `/work/ironman` were the three invented showcase placeholders, and they
     * are the reason this list is worth keeping tight: a `/work/*` path the
     * live site has never heard of is a case study nobody wrote.
     */
    it('adds only the greenfield paths that are meant to be new', () => {
      // A live URL this redesign moved is not greenfield — it is the same
      // document at the address ADR 0017 gave it. Comparing against the moved
      // set rather than the raw sitemap keeps this list about new *content*.
      const liveSet = new Set(live.map((url) => movedPath(url) ?? url))
      const added = [...paths].filter((p) => !liveSet.has(p)).sort()
      expect(added).toEqual([
        '/insights/how-we-redesigned-our-website-in-a-single-weekend',
        '/insights/the-design-team-moved-the-file',
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

  it('explains every rule it declined to carry', () => {
    for (const row of map.dropped) {
      expect(row.reason.length, `${row.source} was dropped without a reason`).toBeGreaterThan(20)
    }
  })

  it('records a reason beside every hand-decided destination', () => {
    for (const [source, { why }] of Object.entries(UNREDIRECTED_LIVE_URLS)) {
      expect(why.length, `${source} has no reason`).toBeGreaterThan(20)
    }
  })
})
