import { z } from 'zod'

import { COLLECTION_PREFIXES } from '@o3/sanity/constants'

import {
  convertHtml,
  createKeyGenerator,
  normalizeUploadUrl,
  type ConversionIssue,
} from '../lib/htmlToPortableText'
import { migrationObject } from '../core/state'
import type { WpSeo, WpSiteSeo } from '../lib/yoast'
import { checkPathParity } from './paths'
import type { PersonDirectory } from './person'
import { mapSeo, seoObject } from './seo'
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
  seo: WpSeo
  fields?: {
    header?: { description?: string }
    flexible_post_content?: Record<string, unknown>[]
    /** ACF team-post ids. Where set, this — not `post_author` — is the byline. */
    author?: number[] | string
  }
}

export const insightDoc = z.object({
  /* Both deterministic id forms (README → Rules of the road): `-wp-<id>` for a
   * migrated post, `-seed-<slug>` for one written here. `verify` re-runs this
   * gate over the whole dataset, so a seeded insight has to satisfy the
   * same shape a converted one does — which is the point, not a loophole. */
  _id: z.string().regex(/^insight-(wp-\d+|seed-[a-z0-9-]+)$/),
  _type: z.literal('insight'),
  title: z.string().min(1),
  slug: z.object({ _type: z.literal('slug'), current: z.string().min(1) }),
  excerpt: z.string().min(1),
  /* Optional, because most posts have no byline. See `mapInsight`. */
  author: z.object({ _type: z.literal('reference'), _ref: z.string() }).optional(),
  categories: z.array(
    z.object({ _type: z.literal('reference'), _ref: z.string(), _key: z.string() }),
  ),
  publishedAt: z.string().datetime(),
  featuredImage: z.unknown().optional(),
  body: z.array(z.record(z.string(), z.unknown())).min(1),
  seo: seoObject.optional(),
  migration: migrationObject,
})

export type InsightDoc = z.infer<typeof insightDoc>

/**
 * The ACF `video` module stores its source two ways: `external` keeps the
 * oEmbed **iframe HTML** WordPress cached (not a URL), `file` keeps an
 * uploaded mp4. Both become an `embed`; the iframe's `src` is what the
 * renderer needs, and the mp4 is an ordinary upload the loader migrates.
 */
function videoModuleUrl(mod: Record<string, unknown>): string | null {
  const external = typeof mod.external_url === 'string' ? mod.external_url : ''
  if (external) {
    const src = /<iframe[^>]*\ssrc=["']([^"']+)["']/i.exec(external)?.[1]
    // A bare URL rather than an iframe is equally valid input here.
    const url = src ?? (/^https?:\/\//.test(external.trim()) ? external.trim() : null)
    if (url) return decodeHtmlEntities(url)
  }
  const file = mod.video_file
  if (file && typeof file === 'object' && typeof (file as { url?: unknown }).url === 'string') {
    return normalizeUploadUrl((file as { url: string }).url)
  }
  return null
}

/** The ACF `image` module's image array → a `figure` body block. */
function imageModuleFigure(
  mod: Record<string, unknown>,
  nextKey: () => string,
): Record<string, unknown> | null {
  const image = mod.image
  if (!image || typeof image !== 'object') return null
  const { url, alt, title, caption } = image as Record<string, unknown>
  if (typeof url !== 'string' || !url) return null
  return {
    _type: 'figure',
    _key: nextKey(),
    image: { _type: 'image', _wpSrc: normalizeUploadUrl(url) },
    alt: (typeof alt === 'string' && alt) || (typeof title === 'string' ? title : ''),
    ...(typeof caption === 'string' && caption ? { caption } : {}),
  }
}

/** `&amp;` → `&`. WordPress stores its cached oEmbed HTML entity-encoded. */
function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
}

/**
 * One WP post → one insight document, or the list of reasons it could not
 * be converted. The ACF `flexible_post_content` module set is the fail-loud
 * surface: an unmapped `acf_fc_layout` is reported, never dropped, and the
 * response is a new mapper arm plus a decision on the ticket (#25 agreement 2).
 *
 * Adding a module type means adding an arm to the switch below and a case to
 * insight.test.ts — those are the only two places that need to change.
 *
 * `site` carries the Yoast site-wide defaults the seo mapping needs (#26);
 * it comes from `data/extract/site/seo.json`. `people` resolves the byline
 * (#17) — see `PersonDirectory` for why that is not just `post_author`.
 */
export function mapInsight(
  post: WpPerspective,
  site: WpSiteSeo,
  people: PersonDirectory,
): Mapped<InsightDoc> {
  const issues: ConversionIssue[] = []
  const notes: ConversionIssue[] = []
  const modules = post.fields?.flexible_post_content ?? []
  const body: Record<string, unknown>[] = []
  // One sequence per document, shared across its modules so keys stay unique
  // within the body and identical across runs.
  const nextKey = createKeyGenerator()

  for (const mod of modules) {
    const layout = mod.acf_fc_layout as string
    switch (layout) {
      case 'text':
        body.push(
          ...(convertHtml(String(mod.text_editor ?? ''), issues, nextKey, notes) as Record<
            string,
            unknown
          >[]),
        )
        break
      case 'video': {
        const url = videoModuleUrl(mod)
        if (url) body.push({ _type: 'embed', _key: nextKey(), url })
        else issues.push({ element: 'acf module', detail: 'video module with no usable source' })
        break
      }
      case 'image': {
        const figure = imageModuleFigure(mod, nextKey)
        if (figure) body.push(figure)
        else issues.push({ element: 'acf module', detail: 'image module with no usable image' })
        break
      }
      default:
        issues.push({ element: `acf module`, detail: `unmapped layout "${layout}"` })
    }
  }

  // The Yoast meta description is the last excerpt fallback: it is hand-written
  // editorial summary copy, which is exactly what `excerpt` means, and the two
  // posts with no header description or WP excerpt both have one.
  const excerpt = (
    post.fields?.header?.description ||
    post.excerpt ||
    post.seo?.descriptionOverride ||
    ''
  ).trim()
  if (!excerpt) {
    issues.push({ element: 'excerpt', detail: 'no header.description, post_excerpt or metadesc' })
  }
  if (body.length === 0) issues.push({ element: 'body', detail: 'no convertible modules' })

  // Path parity is a conversion gate, not a review note (#26): an insight
  // that would move off the URL WordPress serves it at stops the run.
  const parity = checkPathParity(
    post.seo?.canonicalRendered ?? '',
    `${COLLECTION_PREFIXES.insight}/${post.slug}`,
  )
  if (parity) issues.push(parity)

  // The ACF `author` field is the byline, and the only one. `post_author` used
  // to stand in for it, which put "Brian Crumley" on 223 posts that show no
  // byline at all on the live site: the theme derives nothing visible from the
  // publishing account, and Yoast's machine meta — `<meta name="author">`,
  // `twitter:data1`, the JSON-LD `author` — is the only place it surfaces.
  // Yoast stamps it into the ACF-bylined posts too, so it is not even a signal
  // there. A post with no ACF author has no author; the renderer draws date and
  // read time alone, which is what o3world.com draws today.
  //
  // Absence is therefore normal, not a finding — no issue and no note. What IS
  // reported is the third case: an ACF byline pointing at a team post that no
  // longer exists (7 posts, team ids 5102 / 5320 / 7533 / 8031). WordPress
  // renders nothing for those either, so the document is correct without an
  // author, but an editor named someone and the record is gone — a source
  // cleanup, which is exactly what `notes` is for.
  const acfAuthorId = Array.isArray(post.fields?.author) ? post.fields.author[0] : undefined
  const authorRef = acfAuthorId !== undefined ? people.refForTeam(acfAuthorId) : null
  if (acfAuthorId !== undefined && !authorRef) {
    notes.push({
      element: 'author',
      detail: `ACF byline points at team post ${acfAuthorId}, which no longer exists — no author`,
    })
  }

  if (issues.length > 0) return failed(issues)

  const seo = mapSeo(post.seo, site, post.title, notes)

  const doc = {
    _id: `insight-wp-${post.wpId}`,
    _type: 'insight' as const,
    title: post.title,
    slug: { _type: 'slug' as const, current: post.slug },
    excerpt,
    ...(authorRef ? { author: { _type: 'reference' as const, _ref: authorRef } } : {}),
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
    ...(seo ? { seo } : {}),
    migration: {
      locked: false,
      sourceId: `wp:post:${post.wpId}`,
    },
  }

  const parsed = insightDoc.safeParse(doc)
  if (!parsed.success) {
    return failed(
      parsed.error.issues.map((i) => ({ element: i.path.join('.'), detail: i.message })),
    )
  }
  // Return the constructed literal, not zod's parsed output: `body` and
  // `featuredImage` are typed loosely in the schema and parsing would widen
  // the written JSON's key order.
  return ok(doc, notes)
}
