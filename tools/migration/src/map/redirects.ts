import { COLLECTION_PREFIXES } from '@o3/sanity/constants'

import type { WpRedirectExport } from '../lib/redirects'
import { movedPath, PATH_EXCEPTIONS, PATH_PREFIX_EXCEPTIONS } from './paths'

/**
 * WordPress's redirect map → the app's redirects (#24).
 *
 * A pure function over the committed export, ADR 0013's tables and the set of
 * paths the new site actually serves — so the generated list is reproducible
 * from git and reviewable as a diff, rather than a hand-maintained array that
 * drifts the first time a slug moves.
 *
 * Four things happen here, in this order, and each one is a rule rather than a
 * judgement call made per row:
 *
 * 1. **Normalize.** Both plugins store paths inconsistently (leading slash
 *    optional, trailing slash sometimes, query strings sometimes).
 * 2. **Resolve to the terminal.** The live site chains three deep in places
 *    (`/transcend` → `/ai-solutions` → `/solutions/ai-solutions` → …).
 *    Rebuilding the chain would ship its latency and its leaked link equity,
 *    so every source points straight at where it ends up
 *    ([ADR 0013](../../../docs/adr/0013-services-consolidate-into-solutions.md)).
 * 3. **Re-target.** A terminal that the new site does not serve is useless.
 *    ADR 0013 already decided the `/services/*` and verb-hub answers;
 *    `TERMINAL_OVERRIDES` holds the rest, each with its reason.
 * 4. **Drop what cannot be honoured**, with a reason per row — a redirect to
 *    a URL that will 404 is worse than the 404 it replaces.
 */

export interface AppRedirect {
  /** Path the old site served, leading slash, no trailing slash. */
  readonly source: string
  /** Where it goes now: an app path or an absolute external URL. */
  readonly destination: string
  /** The chain WordPress walked to get here, when it walked one. */
  readonly via?: readonly string[]
}

export interface DroppedRedirect {
  readonly source: string
  readonly target: string | null
  readonly reason: string
}

export interface RedirectMap {
  readonly redirects: readonly AppRedirect[]
  readonly dropped: readonly DroppedRedirect[]
  /** Sources that resolve to somewhere outside this app. */
  readonly external: readonly AppRedirect[]
}

/**
 * ADR 0013's two tables, verbatim. The ADR is the decision record; this is the
 * executable copy, and `redirects.test.ts` checks the two agree on counts so
 * they cannot drift silently.
 *
 * Applied as a **terminal override**, not as extra rows: 21 of these 24
 * already redirect on the live site, and their chains end at two `/solutions/*`
 * landing pages this redesign deletes. Overriding the terminal is what turns
 * "redirect to a page that will 404" into "redirect to `/solutions`".
 */
export const ADR_0013_SERVICE_TERMINALS: Readonly<Record<string, string>> = {
  '/services/ux-audit': '/solutions',
  '/services/benchmark-surveys': '/solutions',
  '/services/content-strategy': '/solutions',
  '/services/customer-journey-mapping': '/solutions',
  '/services/accessibility-audit': '/solutions',
  '/services/advanced-technology-cms-audit': '/solutions',
  '/services/brand-audit': '/solutions',
  '/services/user-type-workshop': '/solutions',
  '/services/data-analysis-benchmarking': '/solutions',
  '/services/conversion-rate-optimization': '/solutions',
  '/services/personalization-strategy': '/solutions',
  // The destination WordPress already chose. Kept because overriding a live
  // editorial decision is not a migration's job (ADR 0013).
  '/services/experience-design': '/',
  '/services/custom-web-mobile-applications': '/solutions',
  '/services/innovation-strategy': '/solutions',
  '/services/api-creation': '/solutions',
  '/services/marketing-automation': '/solutions',
  '/services/systems-integration': '/solutions',
  '/services/software-development': '/solutions',
  '/services/content-management-solutions': '/solutions',
  '/services/video-production': '/solutions',
  '/services/data-analytics-ai-consulting': '/solutions',
  '/services/ensuring-accessibility-in-higher-ed': '/solutions',
  '/services/accessibility-consulting-optimization': '/solutions',
  '/services/ai-consulting': 'https://www.o3xo.ai/',
}

/** ADR 0013's nine chain URLs — live, indexable, and in no sitemap. */
export const ADR_0013_CHAIN_TERMINALS: Readonly<Record<string, string>> = {
  '/engage': '/solutions',
  '/convert': '/solutions',
  '/include': '/solutions',
  '/analyze': '/solutions',
  '/innovate': '/solutions',
  '/transcend': 'https://www.o3xo.ai/',
  '/enterprise-digital-products': '/solutions',
  '/solutions/conversion-rate-optimization-consultant': '/solutions',
  '/solutions/digital-experience-consulting-services': '/solutions',
}

/**
 * Everything else whose terminal the new site cannot serve, with the reason it
 * points where it now points. Read as: "WordPress ends this chain at X; X does
 * not exist here; send it to Y instead."
 *
 * A row is only here because the alternative is a 301 into a 404.
 *
 * **Keys are WordPress's paths, values are this site's.** The three
 * `/perspectives/*` keys are not stale: WordPress still serves that prefix and
 * always will, while the destinations moved to `/insights` with ADR 0017. Any
 * terminal not overridden here goes through `movedPath` for the same reason.
 */
export const TERMINAL_OVERRIDES: Readonly<Record<string, { to: string; why: string }>> = {
  '/careers': {
    to: '/about#careers',
    why: 'Careers is a band on the About page, not a route (docs/content-sourcing.md).',
  },
  '/service/content-strategy': {
    to: '/solutions',
    why: 'The singular `/service/` spelling of a service ADR 0013 consolidates. Same answer.',
  },
  '/mike-gadsby-chief-innovation-officer': {
    to: '/about',
    why: 'A team bio page. #18 kept two utility pages and no bios; the team lives on /about.',
  },
  '/industry/retail-and-ecommerce': {
    to: '/work',
    why: '`industry` is a taxonomy with no route on the new site (CONTEXT.md). The work it filtered is /work.',
  },
  '/work/3bl': {
    to: '/work',
    why: 'Names a case study that is not among the 20 WordPress serves today.',
  },
  '/perspectives/evolution-of-agile': {
    to: '/insights',
    why: 'Names a post that is no longer published, so it is not in the 272 that migrated.',
  },
  '/perspectives/keith-scandone-on-architecting-great-customer-experiences': {
    to: '/insights',
    why: 'Names a post that is no longer published, so it is not in the 272 that migrated.',
  },
  '/perspectives/slack-amazon-better-team-collaboration': {
    to: '/insights',
    why: 'Names a post that is no longer published, so it is not in the 272 that migrated.',
  },
  'https://www.o3xo.ai.com/insights/ai-roi-beyond-efficiency/': {
    to: 'https://www.o3xo.ai/insights/ai-roi-beyond-efficiency/',
    why: 'The host in WordPress is a typo — `o3xo.ai.com` does not resolve (checked 2026-08-02). Its 32 sibling rows all use `o3xo.ai`, and the corrected URL 308s like they do. Shipping the typo would be a redirect into DNS failure.',
  },
}

/**
 * Live URLs the WordPress redirect map has no row for, because WordPress still
 * serves them — and this site will not.
 *
 * They come out of #24's diff against the live Yoast sitemaps rather than out
 * of the redirect table, which is the whole reason that diff exists: a page
 * that never needed a redirect on the old site needs one the moment it stops
 * existing. Each names where it goes and why, on the same relevance rule
 * ADR 0013 argues — the source URL tells you what the visitor wanted.
 */
export const UNREDIRECTED_LIVE_URLS: Readonly<Record<string, { to: string; why: string }>> = {
  '/careers': {
    to: '/about#careers',
    why: 'Careers is a band on About, not a route (docs/content-sourcing.md).',
  },
  '/community-engagement': {
    to: '/about',
    why: 'A culture page. About carries the culture band that replaces it.',
  },
  '/mike-gadsby-chief-innovation-officer': {
    to: '/about',
    why: 'A team bio page. #18 migrated two utility pages and no bios; the team is on /about.',
  },
  '/1682-photos': {
    to: '/1682-conference-ai-innovation',
    why: 'A photo gallery for the conference. The conference page is what it belonged to.',
  },
  '/lunch-and-learn-with-o3-empower-your-team-with-ai-insights': {
    to: '/live',
    why: 'A past O3 event. /live is where appearances and events live (ADR 0011).',
  },
  '/conversing-with-the-future-an-interactive-chatgpt-experience': {
    to: '/insights',
    why: 'A one-off interactive AI piece with no home in the new sitemap; the writing archive is the nearest thing.',
  },
  '/acquia-o3': {
    to: '/solutions',
    why: 'A technology-partner page. /solutions is the "what we do and who we do it with" page.',
  },
  '/sitecore': {
    to: '/solutions',
    why: 'Same: a platform-partner page with no equivalent route.',
  },
}

/** How many hops a chain may take before it is treated as broken data. */
const MAX_HOPS = 10

/**
 * `services/foo/` → `/services/foo`; an absolute URL is returned untouched.
 * Returns `null` for input with no path in it.
 */
export function normalizePath(raw: string | null | undefined): string | null {
  const value = raw?.trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  const withSlash = value.startsWith('/') ? value : `/${value}`
  const withoutHash = withSlash.split('#')[0]!
  const trimmed = withoutHash.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

const isExternal = (path: string) => /^https?:\/\//i.test(path)

export interface BuildRedirectMapInput {
  readonly wp: WpRedirectExport
  /** Every path the new site serves — `sitePaths()` builds it from the corpus. */
  readonly sitePaths: ReadonlySet<string>
}

/**
 * Merge both plugins into one edge list, Redirection first.
 *
 * Redirection wins a conflict because it is the plugin the site is actually
 * administered through — Yoast Premium's copies are older, and two of the
 * three disagreements are Yoast holding a stale mid-chain hop.
 */
function edgesFrom(wp: WpRedirectExport): {
  edges: Map<string, string | null>
  dropped: DroppedRedirect[]
} {
  const edges = new Map<string, string | null>()
  const dropped: DroppedRedirect[] = []

  for (const row of wp.redirection) {
    if (row.status !== 'enabled') {
      dropped.push({ source: row.source, target: row.target, reason: 'disabled in WordPress' })
      continue
    }
    if (row.regex !== '0') {
      dropped.push({
        source: row.source,
        target: row.target,
        reason: 'a regex rule — no equivalent was needed',
      })
      continue
    }
    // Redirection keeps the query string on `url` and strips it into
    // `match_url`. Next.js matches on pathname, so honouring one of these
    // would apply it to every request for the bare path — and the one row
    // that carries a query is `/?resource_type=ebook`, i.e. the homepage.
    if (row.source.includes('?')) {
      dropped.push({
        source: row.source,
        target: row.target,
        reason: 'matches on a query string; a pathname redirect would capture the bare path too',
      })
      continue
    }
    const source = normalizePath(row.source)
    if (!source) {
      dropped.push({
        source: row.source,
        target: row.target,
        reason: 'source does not parse as a path',
      })
      continue
    }
    // Redirection allows two rows with one source; position decides which one
    // WordPress serves, and the export is in position order — so the earlier
    // row is live and later duplicates are recorded, not silently swallowed.
    // (10 exist today: 8 are trailing-slash twins whose targets normalize to
    // the same path, so the choice is cosmetic for all but two, and both of
    // those are ADR 0013 sources whose terminal the tables decide anyway.)
    if (edges.has(source)) {
      dropped.push({
        source: row.source,
        target: row.target,
        reason: 'duplicate source; an earlier Redirection row already claims it',
      })
      continue
    }
    edges.set(source, normalizePath(row.target))
  }

  for (const [rawSource, entry] of Object.entries(wp.yoastPlain)) {
    // Same guard as the Redirection rows above. No Yoast row carries a query
    // today; the guard is here so a future re-export cannot regress this.
    if (rawSource.includes('?')) {
      dropped.push({
        source: rawSource,
        target: entry.type === 410 ? null : entry.url,
        reason: 'matches on a query string; a pathname redirect would capture the bare path too',
      })
      continue
    }
    const source = normalizePath(rawSource)
    if (!source || edges.has(source)) continue
    edges.set(source, entry.type === 410 ? null : normalizePath(entry.url))
  }

  // ADR 0013's tables are sources in their own right, not just terminals.
  // Three of the 24 services and both `/solutions/*` landing pages still serve
  // their own page today, so WordPress has no redirect row for them and the
  // export cannot supply one — but they are in `services-sitemap.xml` and
  // `page-sitemap.xml`, which is to say they are indexed URLs about to 404.
  for (const [source, target] of [
    ...Object.entries(ADR_0013_SERVICE_TERMINALS),
    ...Object.entries(ADR_0013_CHAIN_TERMINALS),
  ]) {
    if (!edges.has(source)) edges.set(source, target)
  }

  for (const [source, { to }] of Object.entries(UNREDIRECTED_LIVE_URLS)) {
    if (!edges.has(source)) edges.set(source, to)
  }

  return { edges, dropped }
}

/**
 * Follow a source to where WordPress finally lands it, applying ADR 0013's
 * decisions as soon as the walk reaches a URL they cover.
 */
function terminalFor(
  source: string,
  edges: ReadonlyMap<string, string | null>,
): { target: string | null; via: string[] } | 'cycle' {
  const via: string[] = []
  let current = source

  for (let hop = 0; hop <= MAX_HOPS; hop++) {
    const decided = ADR_0013_SERVICE_TERMINALS[current] ?? ADR_0013_CHAIN_TERMINALS[current]
    if (decided) return { target: decided, via }

    if (!edges.has(current)) return { target: current, via }
    const next = edges.get(current) ?? null
    if (next === null) return { target: null, via }
    if (isExternal(next)) return { target: next, via }
    if (via.includes(next) || next === source) return 'cycle'
    via.push(next)
    current = next
  }
  return 'cycle'
}

/** Every path the new site serves, for deciding whether a terminal is real. */
export function sitePaths(input: {
  readonly pageSlugs: readonly string[]
  readonly insightSlugs: readonly string[]
  readonly caseStudySlugs: readonly string[]
}): Set<string> {
  const paths = new Set(['/', COLLECTION_PREFIXES.caseStudy, COLLECTION_PREFIXES.insight])
  for (const slug of input.pageSlugs) paths.add(slug === 'index' ? '/' : `/${slug}`)
  for (const slug of input.insightSlugs) paths.add(`${COLLECTION_PREFIXES.insight}/${slug}`)
  for (const slug of input.caseStudySlugs) paths.add(`${COLLECTION_PREFIXES.caseStudy}/${slug}`)
  return paths
}

/**
 * Sources allowed to resolve to themselves, each with the reason it happens.
 *
 * A self-redirect is normally a bug that Next.js turns into an infinite loop,
 * so `buildRedirectMap` throws on one. A collection rename is the case where
 * it is not: WordPress has always redirected `/insights` to `/perspectives`,
 * and once `/perspectives/*` moves to `/insights/*` (ADR 0017) that row points
 * at its own source. It is dropped, because the destination is now a route
 * this site serves directly — but dropped *on purpose*, with the reason in the
 * generated report, like every other row this file discards.
 */
const SELF_REDIRECT_EXCEPTIONS: Readonly<Record<string, string>> = {
  [COLLECTION_PREFIXES.insight]:
    'WordPress redirected /insights → /perspectives; ADR 0017 moved /perspectives to ' +
    '/insights, so the row now names its own source. The app serves this path.',
}

export function buildRedirectMap({ wp, sitePaths: paths }: BuildRedirectMapInput): RedirectMap {
  const { edges, dropped } = edgesFrom(wp)
  const redirects: AppRedirect[] = []
  const external: AppRedirect[] = []

  // A deliberate path change recorded in PATH_EXCEPTIONS is a redirect the
  // converter promised and only this map can keep (`map/paths.ts`).
  for (const exception of PATH_EXCEPTIONS) {
    redirects.push({ source: exception.from, destination: exception.to })
  }

  for (const source of [...edges.keys()].sort()) {
    const resolved = terminalFor(source, edges)
    if (resolved === 'cycle') {
      dropped.push({
        source,
        target: edges.get(source) ?? null,
        reason: 'the chain loops in WordPress',
      })
      continue
    }

    let { target } = resolved
    if (target === null) {
      dropped.push({
        source,
        target: null,
        reason: 'WordPress answers 410 Gone; the app 404s, which is the closest it can say',
      })
      continue
    }

    const override = TERMINAL_OVERRIDES[target]
    if (override) target = override.to

    // A terminal WordPress still names by its old path — `/perspectives/foo`
    // — has to arrive at the path this site actually serves (ADR 0017).
    // Without this the map would 301 visitors onto a route that only
    // redirects again, adding a hop to 145 rows.
    const moved = movedPath(target)
    if (moved) target = moved

    // An external terminal is allowed to shadow a document this migration
    // loaded, and 32 of them do: WordPress still holds the posts (so the
    // extractor found them) while 301ing their URLs to o3xo.ai, which is where
    // their owners moved them. Serving them here would republish content the
    // site deliberately gave away, against the domain it gave it to. The
    // sitemap reads this same list and drops anything in it, so the app never
    // advertises a URL it redirects.
    if (isExternal(target)) {
      const entry = { source, destination: target, via: resolved.via }
      external.push(entry)
      redirects.push(entry)
      continue
    }

    if (target === source) {
      const excused = SELF_REDIRECT_EXCEPTIONS[source]
      if (!excused) {
        // Not a row to quietly discard. Next.js would serve this as an
        // infinite redirect, and the only way one appears is that a rule
        // above rewrote the terminal onto its own source — a mistake in this
        // file, not in WordPress's data. Fail the generator so it is found
        // here rather than in production.
        throw new Error(
          `redirect resolves to itself: "${source}" → "${target}". ` +
            `If this is expected — a collection rename can turn an old row into a ` +
            `self-reference — record it in SELF_REDIRECT_EXCEPTIONS with the reason.`,
        )
      }
      dropped.push({ source, target, reason: excused })
      continue
    }
    // An internal one may not: it would shadow the page it names for no gain.
    if (paths.has(source)) {
      dropped.push({
        source,
        target,
        reason: 'the source is a path this site serves — a redirect here would shadow the document',
      })
      continue
    }
    if (!paths.has(target.split('#')[0]!)) {
      dropped.push({
        source,
        target,
        reason: `nothing serves "${target}" on the new site and no override names a replacement`,
      })
      continue
    }

    redirects.push({ source, destination: target, via: resolved.via })
  }

  /**
   * A moved collection, as one parameterized rule per prefix rather than one
   * row per document (ADR 0017). 272 rows would say the same thing 272 times
   * and go stale the first time a slug changed.
   *
   * Appended **after** the sorted rows on purpose: Next.js takes the first
   * match, and some of those rows are more specific than this one. Three
   * retired articles redirect to the index rather than to their own new path,
   * and a wildcard placed above them would send visitors to a 404 instead.
   */
  const prefixRules: AppRedirect[] = []
  for (const rule of PATH_PREFIX_EXCEPTIONS) {
    prefixRules.push({ source: rule.fromPrefix, destination: rule.toPrefix })
    prefixRules.push({
      source: `${rule.fromPrefix}/:slug`,
      destination: `${rule.toPrefix}/:slug`,
    })
  }

  return {
    redirects: [...redirects.sort((a, b) => a.source.localeCompare(b.source)), ...prefixRules],
    dropped: dropped.sort((a, b) => a.source.localeCompare(b.source)),
    external,
  }
}
