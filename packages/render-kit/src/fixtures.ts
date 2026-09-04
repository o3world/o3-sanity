import { COLLECTION_INDEX_QUERY, SITE_SETTINGS_QUERY } from '@o3/sanity/queries'
import type {
  CASE_STUDIES_PAGE_QUERY_RESULT,
  COLLECTION_INDEX_QUERY_RESULT,
  CASE_STUDY_QUERY_RESULT,
  INSIGHT_QUERY_RESULT,
  INSIGHTS_PAGE_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
} from '@o3/sanity/types/generated'

/**
 * Fixture builders for the `render` layer.
 *
 * Each is typed as the GENERATED query result, so these are not free-form
 * objects: when a query projection changes, typegen changes the result type
 * and every stale fixture becomes a compile error. That is the same
 * compile-time guardrail the block registry uses (ADR 0001), pointed at test
 * data.
 *
 * Pass only the fields your assertion is about; the rest come from a valid
 * default, so a test reads as "this one thing differs".
 *
 * Everything here is invented and brand-neutral: the queries are shared, so
 * a fixture is about the shape a route receives rather than about either
 * site's content. Documents read off disk are the app's own business —
 * `apps/web/src/test/fixtures.ts` reads the migration corpus, `apps/o3xo`'s
 * reads its bootstrap seeds.
 */

export type Insight = NonNullable<INSIGHT_QUERY_RESULT>

/** A Portable Text paragraph, the shape `htmlToBlocks` produces. */
export function paragraph(text: string, key = 'k0000') {
  return {
    _type: 'block' as const,
    _key: key,
    style: 'normal' as const,
    markDefs: [],
    children: [{ _type: 'span' as const, _key: `${key}s`, text, marks: [] }],
  }
}

export function anInsight(overrides: Partial<Insight> = {}): Insight {
  return {
    _id: 'insight-wp-101',
    _type: 'insight',
    title: 'An Insight',
    slug: 'an-insight',
    excerpt: 'Why this matters.',
    publishedAt: '2026-05-04T13:20:00Z',
    heroMedia: null,
    cardMedia: null,
    author: { name: 'Brian Crumley', title: 'Partner', headshot: null },
    categories: [{ title: 'Strategy', slug: 'strategy' }],
    readingMinutes: 1,
    body: [paragraph('The body of the article.')],
    seo: null,
    // The "Keep reading." band's two feeds (#45). Empty by default so a test
    // about the article itself doesn't render eight cards it never asked for.
    related: [],
    latest: [],
    ...overrides,
  } as Insight
}

/** The card half of an insight — what every listing and feed projects. */
function toCard({ body: _body, seo: _seo, related: _related, latest: _latest, ...card }: Insight) {
  return card
}

/**
 * The insights feed as its query returns it. `categories` is the filter
 * bar's options (#61) — every category with an article, which the query
 * answers separately from the items on the page, so it is a third argument
 * rather than something derived from `items`.
 */
export function anInsightsPage(
  items: Insight[] = [anInsight()],
  total = items.length,
  categories: INSIGHTS_PAGE_QUERY_RESULT['categories'] = [],
): INSIGHTS_PAGE_QUERY_RESULT {
  return {
    items: items.map(toCard),
    total,
    categories,
  } as INSIGHTS_PAGE_QUERY_RESULT
}

export type CaseStudyCard = CASE_STUDIES_PAGE_QUERY_RESULT['items'][number]

/** A case study as every card projection sees it — the index, Home, next-case. */
export function aCaseStudyCard(overrides: Partial<CaseStudyCard> = {}): CaseStudyCard {
  return {
    _id: 'caseStudy-seed-a-case',
    _type: 'caseStudy',
    title: 'A Case Study',
    slug: 'a-case-study',
    narrativeHeadline: 'The deeper problem we found.',
    headlineStat: null,
    cardMedia: null,
    client: null,
    industries: [{ title: 'Healthcare' }],
    industryDetail: 'Pediatric Systems',
    ...overrides,
  } as CaseStudyCard
}

export type CaseStudy = NonNullable<CASE_STUDY_QUERY_RESULT>

/**
 * A case study as its detail query returns it — the compositional middle
 * (ADR 0018) empty, so a test about one band renders only that band.
 */
export function aCaseStudy(overrides: Partial<CaseStudy> = {}): CaseStudy {
  return {
    _id: 'caseStudy-seed-a-case',
    _type: 'caseStudy',
    title: 'A Case Study',
    slug: 'a-case-study',
    narrativeHeadline: 'The deeper problem we found.',
    headlineStat: null,
    heroMedia: null,
    cardMedia: null,
    client: null,
    industries: [{ title: 'Healthcare' }],
    industryDetail: 'Pediatric Systems',
    stats: [],
    deliverables: [],
    story: [],
    seo: null,
    next: null,
    ...overrides,
  } as CaseStudy
}

/** One page of the case-study index feed. */
export function aCaseStudiesPage(
  items: CaseStudyCard[] = [aCaseStudyCard()],
  total = items.length,
): CASE_STUDIES_PAGE_QUERY_RESULT {
  return { items, total } as CASE_STUDIES_PAGE_QUERY_RESULT
}

export type CollectionIndex = NonNullable<COLLECTION_INDEX_QUERY_RESULT>
export type IndexSection = NonNullable<CollectionIndex['sectionsAbove']>[number]

/**
 * The chrome around a collection's feed (#347), both arrays empty by default —
 * so a test about one band renders only that band, the way `aCaseStudy` leaves
 * `story` empty.
 */
export function aCollectionIndex(overrides: Partial<CollectionIndex> = {}): CollectionIndex {
  return {
    _id: 'collectionIndex-insight',
    _type: 'collectionIndex',
    title: 'Insights index',
    collection: 'insight',
    sectionsAbove: [],
    sectionsBelow: [],
    seo: null,
    ...overrides,
  } as CollectionIndex
}

/**
 * A CTA band, the cheapest section to author in a fixture: two strings and no
 * reference to dereference, so an assertion about WHERE a band rendered is not
 * also an assertion about what it needed to render at all.
 */
export function aCtaBand(heading: string, key = 'band0'): IndexSection {
  return {
    _type: 'ctaSection',
    _key: key,
    heading,
    body: null,
    button: null,
    decoration: 'none',
    surface: null,
    backgroundMedia: null,
  } as unknown as IndexSection
}

/**
 * Site Settings as `SITE_SETTINGS_QUERY` returns them — the defaults tier of
 * the SEO chain (#26) and the source of the nav/footer chrome.
 */
export function siteSettings(
  overrides: Partial<NonNullable<SITE_SETTINGS_QUERY_RESULT>> = {},
): SITE_SETTINGS_QUERY_RESULT {
  return {
    title: 'O3',
    navItems: [],
    primaryButton: null,
    footerTagline: null,
    footerGroups: [],
    socialsLabel: 'Socials',
    socialLinks: [],
    legalLinks: [],
    legalName: 'O3 World, LLC',
    copyrightNote: null,
    defaultSeo: null,
    ...overrides,
  } as SITE_SETTINGS_QUERY_RESULT
}

/**
 * A dataset resolver for a route that fetches both a document and Site
 * Settings — which, since #26, is every route with `generateMetadata`.
 *
 *   renderRoute(route, { data: withSettings(anInsight()), params: { slug } })
 */
export function withSettings(
  doc: unknown,
  settings: SITE_SETTINGS_QUERY_RESULT = siteSettings(),
): (call: { query: string }) => unknown {
  return (call) => (call.query === SITE_SETTINGS_QUERY ? settings : doc)
}

/**
 * A dataset resolver for a collection index, which reads three ways: the feed,
 * the chrome document around it, and Site Settings (#347).
 *
 * `document` defaults to `null` — the state an index is in before anyone has
 * authored its bands, and the one the route must render the feed through
 * rather than 404 on.
 */
export function withIndexChrome(
  feed: unknown,
  document: unknown = null,
  settings: SITE_SETTINGS_QUERY_RESULT = siteSettings(),
): (call: { query: string }) => unknown {
  return (call) => {
    if (call.query === SITE_SETTINGS_QUERY) return settings
    if (call.query === COLLECTION_INDEX_QUERY) return document
    return feed
  }
}
