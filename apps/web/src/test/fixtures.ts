import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SITE_SETTINGS_QUERY } from '@o3/sanity/queries'
import type {
  CASE_STUDIES_PAGE_QUERY_RESULT,
  INSIGHT_QUERY_RESULT,
  INSIGHTS_PAGE_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
} from '@o3/sanity/types/generated'

import { projectSeedPage, resolveAssetMarkers, type SeedDoc } from '@o3/content-ui/testing'

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
 */

type Insight = NonNullable<INSIGHT_QUERY_RESULT>

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
    featuredImage: null,
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
 * The /insights feed as its query returns it. `categories` is the filter
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

type CaseStudyCard = CASE_STUDIES_PAGE_QUERY_RESULT['items'][number]

/** A case study as every card projection sees it — `/work`, Home, next-case. */
export function aCaseStudyCard(overrides: Partial<CaseStudyCard> = {}): CaseStudyCard {
  return {
    _id: 'caseStudy-seed-a-case',
    _type: 'caseStudy',
    title: 'A Case Study',
    slug: 'a-case-study',
    narrativeHeadline: 'The deeper problem we found.',
    headlineStat: null,
    heroMedia: null,
    client: null,
    industries: [{ title: 'Healthcare' }],
    industryDetail: 'Pediatric Systems',
    ...overrides,
  } as CaseStudyCard
}

/** One page of the `/work` index feed. */
export function aCaseStudiesPage(
  items: CaseStudyCard[] = [aCaseStudyCard()],
  total = items.length,
): CASE_STUDIES_PAGE_QUERY_RESULT {
  return { items, total } as CASE_STUDIES_PAGE_QUERY_RESULT
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
 * Stand in for the asset upload `tools/migration/src/load.ts` performs, so a
 * converted document can be rendered without a dataset.
 *
 * Converted JSON carries `_wpSrc` URL markers where an asset reference will
 * go; `load` uploads the binary and swaps in the ref. A renderer given the
 * raw marker throws inside `@sanity/image-url`, which would make the
 * migration→render bridge unusable for any document with an image in its
 * body — i.e. most of the 272 coming in #17. Seeds use `_localSrc` (a repo
 * path) instead of a URL and are resolved the same way. The ref is a sha1 of the source
 * URL, which is both deterministic and the shape `@sanity/image-url` parses
 * (`image-<40 hex>-<width>x<height>-<ext>`); anything looser is rejected.
 *
 * A **fabricated** id, deliberately: this layer renders to a string and never
 * fetches, so what matters is that the id parses. The stories layer resolves
 * the real ids out of `data/assets.json` instead, because a browser actually
 * loads the picture — see `@o3/content-ui/testing/seed`.
 */
function resolveWpSrcMarkers(node: unknown): unknown {
  return resolveAssetMarkers(node, (source) => {
    const id = createHash('sha1').update(source).digest('hex')
    const ext = /\.(\w+)$/.exec(source)?.[1]?.toLowerCase() ?? 'jpg'
    return `image-${id}-1200x630-${ext}`
  })
}

/**
 * A real converted document from `tools/migration/data/converted/`, shaped
 * into what the detail query returns (references dereferenced, `slug.current`
 * flattened, `_wpSrc` markers resolved as `load` would).
 *
 * This is the bridge between the migration layer and the render layer: it
 * renders content that actually came out of WordPress, so a mapper change that
 * produces something the renderer cannot display fails here rather than in
 * Studio. Pass no slug to get the first document on disk.
 */
export function aMigratedInsight(slug?: string): Insight {
  const dir = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../tools/migration/data/converted/insight',
  )
  const file = slug ? `${slug}.json` : readdirSync(dir).filter((f) => f.endsWith('.json'))[0]
  if (!file) throw new Error(`No converted insight found in ${dir}`)

  const doc = resolveWpSrcMarkers(JSON.parse(readFileSync(join(dir, file), 'utf8'))) as {
    _id: string
    title: string
    slug: { current: string }
    excerpt: string
    publishedAt: string
    body: unknown
    author?: { _ref: string }
    featuredImage?: unknown
    seo?: unknown
  }

  return anInsight({
    _id: doc._id,
    title: doc.title,
    slug: doc.slug.current,
    excerpt: doc.excerpt,
    publishedAt: doc.publishedAt,
    body: doc.body as Insight['body'],
    readingMinutes: readingMinutesOf(doc.body),
    // The byline as it really is: 239 of the 272 migrated documents have none
    // (#32 item 1.1), so the default fixture author would hide the state most
    // of the archive is actually in.
    author: migratedPerson(doc.author?._ref),
    featuredImage: (doc.featuredImage ?? null) as Insight['featuredImage'],
    seo: (doc.seo ?? null) as Insight['seo'],
  })
}

/** The `author->{name, title, headshot}` projection, off the committed person. */
function migratedPerson(ref: string | undefined): Insight['author'] {
  if (!ref) return null
  const path = join(CONVERTED_DIR, 'person', `${ref}.json`)
  if (!existsSync(path)) throw new Error(`converted insight references missing ${ref}`)
  const person = resolveWpSrcMarkers(JSON.parse(readFileSync(path, 'utf8'))) as {
    name: string
    title?: string
    headshot?: unknown
  }
  return {
    name: person.name,
    title: person.title ?? null,
    headshot: (person.headshot ?? null) as NonNullable<Insight['author']>['headshot'],
  }
}

/**
 * The reading time the GROQ projection would return for this body, ported —
 * `math::max([1, round(length(pt::text(body)) / 5 / 200)])`. Reading time is
 * computed, never stored (#45), so a fixture standing in for the query has to
 * compute it too; a hardcoded number here would let the renderer pass a test
 * the real projection would fail.
 */
function readingMinutesOf(body: unknown): number {
  const text = Array.isArray(body)
    ? body
        .map((block) =>
          ((block as { children?: unknown[] })?.children ?? [])
            .map((child) => (child as { text?: unknown })?.text)
            .filter((span): span is string => typeof span === 'string')
            .join(''),
        )
        // `pt::text` separates blocks with a blank line.
        .join('\n\n')
    : ''
  return Math.max(1, Math.round(text.length / 5 / 200))
}

const CONVERTED_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../tools/migration/data/converted',
)

/**
 * A migrated `page` (#18), shaped into what `PAGE_QUERY` returns — `slug`
 * flattened, `_wpSrc` markers resolved. The migrated utility pages compose
 * only self-contained sections, so nothing needs dereferencing.
 */
export function aMigratedPage(slug: string): Record<string, unknown> {
  const doc = resolveWpSrcMarkers(
    JSON.parse(readFileSync(join(CONVERTED_DIR, 'page', `${slug}.json`), 'utf8')),
  ) as Record<string, unknown>
  return { ...doc, slug: (doc.slug as { current?: string } | undefined)?.current ?? null }
}

/** Every migrated page slug on disk — for `it.each` sweeps. */
export function migratedPageSlugs(): string[] {
  const dir = join(CONVERTED_DIR, 'page')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
}

/**
 * The committed agent translation (#21), shaped into what `CASE_STUDY_QUERY`
 * returns — slug flattened, `client`/`industries` dereferenced from the
 * committed seeds, `_meta` dropped the way `load` drops it.
 *
 * The dataset is disposable (ADR 0003), so this is the check that survives a
 * rebuild: the committed JSON renders through the real route.
 */
export function aTranslatedCaseStudy(slug: string): Record<string, unknown> {
  const doc = readTranslatedCaseStudy(slug)

  const byId = new Map(
    ['client', 'industry'].flatMap((type) =>
      seedsOfType(type).map((seed) => [seed._id as string, seed] as const),
    ),
  )
  const deref = (ref: unknown) => byId.get((ref as { _ref?: string })?._ref ?? '') ?? null

  return {
    ...doc,
    slug: (doc.slug as { current?: string } | undefined)?.current ?? null,
    client: deref(doc.client),
    industries: ((doc.industries ?? []) as unknown[]).map(deref).filter(Boolean),
    headlineStat: (doc.stats as unknown[] | undefined)?.[0] ?? null,
    next: null,
  }
}

const SEED_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../tools/migration/data/seed',
)

const TRANSLATED_CASE_STUDY_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../tools/migration/data/translated/caseStudy',
)

function readSeed(type: string, name: string): Record<string, unknown> {
  return resolveWpSrcMarkers(
    JSON.parse(readFileSync(join(SEED_DIR, type, `${name}.json`), 'utf8')),
  ) as Record<string, unknown>
}

/**
 * Every seed of a type. Tolerates a missing directory: `data/seed/caseStudy`
 * stopped existing when ADR 0016 retired the three invented showcase
 * placeholders, and a type having no seeds is an ordinary state of the corpus
 * rather than a broken checkout.
 */
function seedsOfType(type: string): Record<string, unknown>[] {
  const dir = join(SEED_DIR, type)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => readSeed(type, f.replace(/\.json$/, '')))
}

/** A committed translation, markers resolved and `_meta` dropped as `load` drops it. */
function readTranslatedCaseStudy(slug: string): Record<string, unknown> {
  const raw = resolveWpSrcMarkers(
    JSON.parse(readFileSync(join(TRANSLATED_CASE_STUDY_DIR, `${slug}.json`), 'utf8')),
  ) as Record<string, unknown>
  return Object.fromEntries(Object.entries(raw).filter(([k]) => k !== '_meta'))
}

/** Every committed translation — the tree the homepage showcase now references. */
function translatedCaseStudies(): Record<string, unknown>[] {
  if (!existsSync(TRANSLATED_CASE_STUDY_DIR)) return []
  return readdirSync(TRANSLATED_CASE_STUDY_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => readTranslatedCaseStudy(f.replace(/\.json$/, '')))
}

/** Every committed document of a type from the CONVERTED tree, markers resolved. */
function convertedOfType(type: string): Record<string, unknown>[] {
  const dir = join(CONVERTED_DIR, type)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map(
      (f) =>
        resolveWpSrcMarkers(JSON.parse(readFileSync(join(dir, f), 'utf8'))) as Record<
          string,
          unknown
        >,
    )
}

/**
 * A committed seed page (#20), shaped into what `PAGE_QUERY` returns.
 *
 * The route builders receive documents that GROQ has already flattened and
 * dereferenced; the committed JSON is the un-projected form. This applies the
 * same projections the query does — `slug.current` flattened, `clients[]->`
 * and `caseStudies[]->` expanded from the other committed seeds — so a seed
 * can be rendered through the real route with no dataset.
 *
 * That makes it the durable proof that a seed renders: the dataset is
 * disposable (ADR 0003), so "it looked right in the browser once" is not a
 * check that survives a rebuild.
 */
export function aSeededPage(name: string): Record<string, unknown> {
  const byId = new Map([
    ...['client', 'industry'].flatMap((type) =>
      seedsOfType(type).map((doc) => [doc._id as string, doc] as const),
    ),
    // The About team band (#56) references MIGRATED people, not seeded ones —
    // that is the whole point of the block, so the resolver has to reach into
    // the converted tree the same way the loaded dataset does.
    ...convertedOfType('person').map((doc) => [doc._id as string, doc] as const),
    // And the homepage showcase references TRANSLATED case studies since ADR
    // 0016 retired the three invented seeds it used to hold. Same reason: the
    // honest question is what resolves in the loaded dataset, which is all
    // three trees.
    ...translatedCaseStudies().map((doc) => [doc._id as string, doc] as const),
  ])

  const resolve = (ref: unknown): SeedDoc | null => {
    const id = (ref as { _ref?: string } | null)?._ref
    return id ? (byId.get(id) ?? null) : null
  }

  return projectSeedPage({
    page: readSeed('page', name),
    resolve,
    latestInsights: [anInsight()],
  })
}

/** Every converted insight slug on disk — for `it.each` sweeps. */
export function migratedInsightSlugs(): string[] {
  const dir = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../tools/migration/data/converted/insight',
  )
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
}
