import { z } from 'zod'

import {
  convertHtml,
  createKeyGenerator,
  normalizeUploadUrl,
  type ConversionIssue,
} from '../lib/htmlToPortableText'
import { failed, ok, toIso, type ExtractMeta, type Mapped } from './types'

export interface WpPerspective {
  _meta: ExtractMeta
  wpId: number
  slug: string
  title: string
  dateGmt: string
  modifiedGmt?: string
  authorId: number
  categoryIds: number[]
  excerpt?: string
  featuredImage?: { url: string; alt?: string } | null
  yoast: { title?: string; description?: string }
  fields?: {
    header?: { description?: string }
    flexible_post_content?: Record<string, unknown>[]
  }
}

export const perspectiveDoc = z.object({
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

export type PerspectiveDoc = z.infer<typeof perspectiveDoc>

/**
 * One WP post → one perspective document, or the list of reasons it could not
 * be converted. The ACF `flexible_post_content` module set is the fail-loud
 * surface: an unmapped `acf_fc_layout` is reported, never dropped, and the
 * response is a new mapper arm plus a decision on the ticket (#25 agreement 2).
 *
 * Adding a module type means adding an arm to the switch below and a case to
 * perspective.test.ts — those are the only two places that need to change.
 */
export function mapPerspective(post: WpPerspective): Mapped<PerspectiveDoc> {
  const issues: ConversionIssue[] = []
  const modules = post.fields?.flexible_post_content ?? []
  const body: Record<string, unknown>[] = []
  // One sequence per document, shared across its modules so keys stay unique
  // within the body and identical across runs.
  const nextKey = createKeyGenerator()

  for (const mod of modules) {
    const layout = mod.acf_fc_layout as string
    if (layout === 'text') {
      body.push(
        ...(convertHtml(String(mod.text_editor ?? ''), issues, nextKey) as Record<
          string,
          unknown
        >[]),
      )
    } else {
      issues.push({ element: `acf module`, detail: `unmapped layout "${layout}"` })
    }
  }

  const excerpt = (post.fields?.header?.description || post.excerpt || '').trim()
  if (!excerpt) issues.push({ element: 'excerpt', detail: 'no header.description or post_excerpt' })
  if (body.length === 0) issues.push({ element: 'body', detail: 'no convertible modules' })

  if (issues.length > 0) return failed(issues)

  const doc = {
    _id: `perspective-wp-${post.wpId}`,
    _type: 'perspective' as const,
    title: post.title,
    slug: { _type: 'slug' as const, current: post.slug },
    excerpt,
    author: { _type: 'reference' as const, _ref: `person-wp-${post.authorId}` },
    categories: post.categoryIds.map((id) => ({
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
    body,
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
    return failed(
      parsed.error.issues.map((i) => ({ element: i.path.join('.'), detail: i.message })),
    )
  }
  // Return the constructed literal, not zod's parsed output: `body` and
  // `featuredImage` are typed loosely in the schema and parsing would widen
  // the written JSON's key order.
  return ok(doc)
}
