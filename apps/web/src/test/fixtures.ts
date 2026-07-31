import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import type {
  PERSPECTIVE_QUERY_RESULT,
  PERSPECTIVES_PAGE_QUERY_RESULT,
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
 * A real converted document from `tools/migration/data/converted/`, shaped
 * into what the detail query returns (references dereferenced, `slug.current`
 * flattened).
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

  const doc = JSON.parse(readFileSync(join(dir, file), 'utf8')) as {
    _id: string
    title: string
    slug: { current: string }
    excerpt: string
    publishedAt: string
    body: unknown
    seo?: { title?: string; description?: string }
  }

  return aPerspective({
    _id: doc._id,
    title: doc.title,
    slug: doc.slug.current,
    excerpt: doc.excerpt,
    publishedAt: doc.publishedAt,
    body: doc.body as Perspective['body'],
    seo: (doc.seo ?? null) as Perspective['seo'],
  })
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
