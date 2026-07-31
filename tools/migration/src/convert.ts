/**
 * Convert → data/converted/<type>/<slug>.json
 *
 * Deterministic transform from data/extract/ to loadable Sanity documents.
 * Per-ACF-module mappers, fail-loud: a document with an unknown module type
 * or unconvertible HTML is reported and NOT written (ADR 0002).
 *
 *   pnpm --filter @o3/migration convert
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { z } from 'zod'

import { CONVERTED_DIR, EXTRACT_DIR, writeJson } from './lib/paths'
import { convertHtml, normalizeUploadUrl, type ConversionIssue } from './lib/htmlToPortableText'

const perspectiveDoc = z.object({
  _id: z.string().regex(/^perspective-wp-\d+$/),
  _type: z.literal('perspective'),
  title: z.string().min(1),
  slug: z.object({ _type: z.literal('slug'), current: z.string().min(1) }),
  excerpt: z.string().min(1),
  author: z.object({ _type: z.literal('reference'), _ref: z.string() }),
  categories: z.array(
    z.object({ _type: z.literal('reference'), _ref: z.string(), _key: z.string() }),
  ),
  publishedAt: z.string().datetime(),
  featuredImage: z.unknown().optional(),
  body: z.array(z.record(z.string(), z.unknown())).min(1),
  seo: z.record(z.string(), z.unknown()).optional(),
  migration: z.object({ locked: z.boolean(), sourceId: z.string(), extractedAt: z.string() }),
})

function readDir(type: string) {
  const dir = join(EXTRACT_DIR, type)
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
}

function toIso(wpGmt: string) {
  return wpGmt.replace(' ', 'T') + 'Z'
}

function addKeys(blocks: Record<string, unknown>[]) {
  return blocks.map((b, i) => ({ _key: `b${i.toString().padStart(3, '0')}`, ...b }))
}

const failures: { slug: string; issues: ConversionIssue[] }[] = []
let written = 0

// --- categories (all) ---
for (const cat of readDir('category')) {
  writeJson(join(CONVERTED_DIR, 'category', `${cat.slug}.json`), {
    _id: `category-wp-${cat.wpId}`,
    _type: 'category',
    title: cat.name,
    slug: { _type: 'slug', current: cat.slug },
    migration: {
      locked: false,
      sourceId: `wp:term:${cat.wpId}`,
      extractedAt: cat._meta.extractedAt,
    },
  })
  written++
}

// --- perspectives + the persons they reference ---
const referencedAuthors = new Set<number>()
for (const post of readDir('perspective')) {
  const issues: ConversionIssue[] = []
  const modules = (post.fields?.flexible_post_content ?? []) as Record<string, unknown>[]
  const body: Record<string, unknown>[] = []

  for (const mod of modules) {
    const layout = mod.acf_fc_layout as string
    if (layout === 'text') {
      body.push(
        ...(convertHtml(String(mod.text_editor ?? ''), issues) as Record<string, unknown>[]),
      )
    } else {
      issues.push({ element: `acf module`, detail: `unmapped layout "${layout}"` })
    }
  }

  const excerpt = (post.fields?.header?.description || post.excerpt || '').trim()
  if (!excerpt) issues.push({ element: 'excerpt', detail: 'no header.description or post_excerpt' })
  if (body.length === 0) issues.push({ element: 'body', detail: 'no convertible modules' })

  if (issues.length > 0) {
    failures.push({ slug: post.slug, issues })
    continue
  }

  const doc = {
    _id: `perspective-wp-${post.wpId}`,
    _type: 'perspective' as const,
    title: post.title,
    slug: { _type: 'slug' as const, current: post.slug },
    excerpt,
    author: { _type: 'reference' as const, _ref: `person-wp-${post.authorId}` },
    categories: (post.categoryIds as number[]).map((id) => ({
      _type: 'reference' as const,
      _ref: `category-wp-${id}`,
      _key: `cat-${id}`,
    })),
    publishedAt: toIso(post.dateGmt),
    ...(post.featuredImage
      ? {
          featuredImage: {
            _type: 'figure',
            image: { _type: 'image', _wpSrc: normalizeUploadUrl(post.featuredImage.url) },
            alt: post.featuredImage.alt || post.title,
          },
        }
      : {}),
    body: addKeys(body),
    ...(post.yoast.title || post.yoast.description
      ? {
          seo: {
            ...(post.yoast.title ? { title: post.yoast.title } : {}),
            ...(post.yoast.description ? { description: post.yoast.description } : {}),
          },
        }
      : {}),
    migration: {
      locked: false,
      sourceId: `wp:post:${post.wpId}`,
      extractedAt: post._meta.extractedAt,
    },
  }

  const parsed = perspectiveDoc.safeParse(doc)
  if (!parsed.success) {
    failures.push({
      slug: post.slug,
      issues: parsed.error.issues.map((i) => ({ element: i.path.join('.'), detail: i.message })),
    })
    continue
  }

  writeJson(join(CONVERTED_DIR, 'perspective', `${post.slug}.json`), doc)
  referencedAuthors.add(post.authorId)
  written++
}

for (const person of readDir('person')) {
  if (!referencedAuthors.has(person.wpId)) continue
  writeJson(join(CONVERTED_DIR, 'person', `${person.slug}.json`), {
    _id: `person-wp-${person.wpId}`,
    _type: 'person',
    name: person.name,
    migration: {
      locked: false,
      sourceId: `wp:user:${person.wpId}`,
      extractedAt: person._meta.extractedAt,
    },
  })
  written++
}

console.log(`converted ${written} documents → ${CONVERTED_DIR}`)
if (failures.length > 0) {
  console.error(`\nFAILED (${failures.length}) — nothing written for these:`)
  for (const f of failures) {
    console.error(`  ${f.slug}`)
    for (const i of f.issues) console.error(`    - [${i.element}] ${i.detail}`)
  }
  process.exitCode = 1
}
