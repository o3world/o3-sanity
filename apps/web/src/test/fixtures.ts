import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { SITE_SETTINGS_QUERY } from '@o3/sanity/queries'
import type {
  PERSPECTIVE_QUERY_RESULT,
  PERSPECTIVES_PAGE_QUERY_RESULT,
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
 */

type Perspective = NonNullable<PERSPECTIVE_QUERY_RESULT>

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

export function aPerspective(overrides: Partial<Perspective> = {}): Perspective {
  return {
    _id: 'perspective-wp-101',
    _type: 'perspective',
    title: 'A Perspective',
    slug: 'a-perspective',
    excerpt: 'Why this matters.',
    publishedAt: '2026-05-04T13:20:00Z',
    featuredImage: null,
    author: { name: 'Brian Crumley', title: 'Partner' },
    categories: [{ title: 'Strategy', slug: 'strategy' }],
    body: [paragraph('The body of the article.')],
    seo: null,
    ...overrides,
  } as Perspective
}

export function aPerspectivesPage(
  items: Perspective[] = [aPerspective()],
  total = items.length,
): PERSPECTIVES_PAGE_QUERY_RESULT {
  return {
    items: items.map(({ body: _body, seo: _seo, ...card }) => card),
    total,
  } as PERSPECTIVES_PAGE_QUERY_RESULT
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
    perspectivesLabel: 'Insights',
    navItems: [],
    primaryCta: null,
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
 *   renderRoute(route, { data: withSettings(aPerspective()), params: { slug } })
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
 */
function resolveWpSrcMarkers(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(resolveWpSrcMarkers)
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const marker = typeof obj._wpSrc === 'string' ? '_wpSrc' : '_localSrc'
    if (typeof obj[marker] === 'string') {
      const source = obj[marker] as string
      const rest = Object.fromEntries(Object.entries(obj).filter(([k]) => k !== marker))
      const id = createHash('sha1').update(source).digest('hex')
      const ext = /\.(\w+)$/.exec(source)?.[1]?.toLowerCase() ?? 'jpg'
      return { ...rest, asset: { _type: 'reference', _ref: `image-${id}-1200x630-${ext}` } }
    }
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [key, resolveWpSrcMarkers(value)]),
    )
  }
  return node
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
export function aMigratedPerspective(slug?: string): Perspective {
  const dir = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../tools/migration/data/converted/perspective',
  )
  const file = slug ? `${slug}.json` : readdirSync(dir).filter((f) => f.endsWith('.json'))[0]
  if (!file) throw new Error(`No converted perspective found in ${dir}`)

  const doc = resolveWpSrcMarkers(JSON.parse(readFileSync(join(dir, file), 'utf8'))) as {
    _id: string
    title: string
    slug: { current: string }
    excerpt: string
    publishedAt: string
    body: unknown
    featuredImage?: unknown
    seo?: unknown
  }

  return aPerspective({
    _id: doc._id,
    title: doc.title,
    slug: doc.slug.current,
    excerpt: doc.excerpt,
    publishedAt: doc.publishedAt,
    body: doc.body as Perspective['body'],
    featuredImage: (doc.featuredImage ?? null) as Perspective['featuredImage'],
    seo: (doc.seo ?? null) as Perspective['seo'],
  })
}

const SEED_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../tools/migration/data/seed',
)

function readSeed(type: string, name: string): Record<string, unknown> {
  return resolveWpSrcMarkers(
    JSON.parse(readFileSync(join(SEED_DIR, type, `${name}.json`), 'utf8')),
  ) as Record<string, unknown>
}

function seedsOfType(type: string): Record<string, unknown>[] {
  return readdirSync(join(SEED_DIR, type))
    .filter((f) => f.endsWith('.json'))
    .map((f) => readSeed(type, f.replace(/\.json$/, '')))
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
  const byId = new Map(
    ['client', 'industry', 'caseStudy'].flatMap((type) =>
      seedsOfType(type).map((doc) => [doc._id as string, doc] as const),
    ),
  )

  const deref = (ref: unknown): Record<string, unknown> | null => {
    const id = (ref as { _ref?: string } | null)?._ref
    return id ? (byId.get(id) ?? null) : null
  }

  /** Flatten `slug` the way every card projection does. */
  const card = (doc: Record<string, unknown> | null) => {
    if (!doc) return null
    const { slug, client, industries, ...rest } = doc
    return {
      ...rest,
      slug: (slug as { current?: string } | undefined)?.current ?? null,
      headlineStat: (doc.stats as unknown[] | undefined)?.[0] ?? null,
      ...(client !== undefined ? { client: deref(client) } : {}),
      ...(industries !== undefined
        ? { industries: (industries as unknown[]).map(deref).filter(Boolean) }
        : {}),
    }
  }

  const page = readSeed('page', name)
  const sections = ((page.sections ?? []) as Record<string, unknown>[]).map((section) => {
    switch (section._type) {
      case 'logoWallSection':
        return { ...section, clients: ((section.clients ?? []) as unknown[]).map(deref) }
      case 'caseShowcaseSection':
        return {
          ...section,
          caseStudies: ((section.caseStudies ?? []) as unknown[]).map((r) => card(deref(r))),
        }
      case 'perspectivesCarouselSection':
        // An empty curated list is the seeded state; the renderer falls back
        // to the `latest` feed the query fetches alongside it.
        return { ...section, curated: [], latest: [aPerspective()] }
      default:
        return section
    }
  })

  return {
    ...page,
    slug: (page.slug as { current?: string } | undefined)?.current ?? null,
    sections,
  }
}

/** Every converted perspective slug on disk — for `it.each` sweeps. */
export function migratedPerspectiveSlugs(): string[] {
  const dir = join(
    dirname(fileURLToPath(import.meta.url)),
    '../../../../tools/migration/data/converted/perspective',
  )
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
}
