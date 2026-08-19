import { assetUrl, type FramerInsight } from '../lib/framer'
import { convertHtml, createKeyGenerator, type ConversionIssue } from '../lib/htmlToPortableText'
import { checkPathParity } from './paths'
import { insightDoc, type InsightDoc } from './insight'
import { seoObject, type SeoObject } from './seo'
import { failed, ok, type ExtractMeta, type Mapped } from './types'
import type { CategoryDoc } from './category'

/**
 * o3xo.ai → the shared content model. The O3XO half of `map/insight.ts`.
 *
 * The two mappers share the gate (`insightDoc`), the HTML→Portable Text
 * converter, the path-parity check and the id contract; they share no mapping
 * rules, because the sources have no fields in common. WordPress hands over ACF
 * flexible content, a Yoast presentation record and a numeric post id; Framer
 * hands over a parsed page (`lib/framer.ts`).
 *
 * ## What the Framer site does not have
 *
 * **A date.** o3xo.ai publishes none: not on the article, not in the head, not
 * in a feed, not as `lastmod` in the sitemap. The only timestamps the HTML
 * carries are `data-framer-ssr-released-at` and `data-framer-page-optimized-at`,
 * which are the last time the *site* was built — the same value on all 40
 * articles, and this week's date for a piece written in 2024. So the date is
 * **synthesised from the sitemap position** (`syntheticPublishedAt`), which is
 * the site's only ordering evidence, and the O3XO site renders no date at all
 * (`showsPublishDates` in brand config). A note says so on every convert run.
 *
 * **A byline.** No author is rendered anywhere on the site, so no `author`
 * reference is written and no `person` document is created. That is the same
 * answer #32 reached for 232 of o3's own articles: no byline shown means no
 * byline migrated.
 *
 * **A real taxonomy.** The eyebrow above the headline is the one label an
 * article carries, so it becomes the single `category` reference.
 */

/** An extract record as committed under the O3XO extract tree. */
export interface FramerInsightRecord extends FramerInsight {
  readonly _meta: ExtractMeta
  /**
   * Where the sitemap lists this article, counting from one, and how many it
   * listed in the same run. The pair is the site's only ordering evidence — it
   * prints no dates — and `syntheticPublishedAt` is what reads it.
   */
  readonly sitemapPosition: number
  readonly sitemapCount: number
}

export interface FramerMapOptions {
  /** Where this brand serves insights, from brand config — never a literal. */
  readonly insightPrefix: string
}

/**
 * The oldest article's date: the far end of the range the collection is spread
 * over. Anchored on the **oldest** rather than the newest so that a newly
 * published article prepends a date instead of renumbering the archive — the
 * site lists newest first, so one new item shifts every position by one.
 */
const OLDEST_PUBLISHED_AT = Date.UTC(2025, 7, 15, 12)

/** Nine days apart puts 40 articles inside 51 weeks. */
const DAYS_BETWEEN_ARTICLES = 9

const DAY_MS = 86_400_000

/**
 * A publication date fabricated from a sitemap position — the o3xo insights'
 * only ordering key (#218).
 *
 * o3xo.ai is dateless by design and the sitemap order is the one thing that says
 * what came first, so a date is synthesised for each article: nine days apart,
 * spread over roughly a year, in the order the sitemap lists them. That makes
 * `order(publishedAt desc)` — the query every feed and index uses — put the
 * collection in the site's own order.
 *
 * **The value is ordering metadata, not a claim about the world.** No O3XO
 * surface renders a date (`showsPublishDates` is `false` for the brand), because
 * printing one would assert a publication date nobody published.
 */
export function syntheticPublishedAt({
  position,
  count,
}: {
  readonly position: number
  readonly count: number
}): string {
  if (!Number.isInteger(position) || position < 1 || position > count) {
    throw new Error(
      `sitemap position ${position} of ${count} is not a place in o3xo.ai's insight inventory`,
    )
  }
  const olderThan = count - position
  const at = new Date(OLDEST_PUBLISHED_AT + olderThan * DAYS_BETWEEN_ARTICLES * DAY_MS)
  // Seconds, no milliseconds — the shape `toIso` gives a WordPress date, so one
  // form of datetime is committed across both sources.
  return `${at.toISOString().slice(0, 19)}Z`
}

/**
 * A Sanity `_id` may hold only `[a-zA-Z0-9._-]`, and two of the 40 slugs carry
 * a curly apostrophe (`…on-pact’s-digital-phorum-podcast`). The URL keeps the
 * character — the site serves it, so path parity requires it — and the id key is
 * reduced to what an id may hold.
 */
export function idKey(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** `Strategy` → `strategy`, `AI & Data` → `ai-data`. */
function categoryKey(name: string): string {
  return idKey(name)
}

/**
 * The eyebrow o3xo.ai prints above a headline, as a `category` document.
 *
 * Framer authors it as free text on the CMS item rather than as a taxonomy
 * record, so there is no term id to key on and the name is the identity.
 */
export function mapFramerCategory(name: string): CategoryDoc {
  const key = categoryKey(name)
  return {
    _id: `category-framer-${key}`,
    _type: 'category' as const,
    title: name.trim(),
    slug: { _type: 'slug' as const, current: key },
    migration: { locked: false, sourceId: `framer:category:${key}` },
  }
}

/**
 * The meta description is the only SEO field the source overrides. The
 * `<title>` it serves is the headline plus ` | O3XO`, which is exactly what the
 * app's own title template composes — storing it would ship `Foo | O3XO | O3XO`,
 * the doubling `mapSeo` exists to prevent on the WordPress side. The canonical
 * is never migrated: a self-referential one pointing back at o3xo.ai would tell
 * Google the new page is a duplicate of the Framer one.
 */
function mapFramerSeo(src: FramerInsight['seo'], notes: ConversionIssue[]): SeoObject | undefined {
  const seo: SeoObject = {}
  const description = src.descriptionOverride.trim()
  if (description) seo.description = description
  if (Object.keys(seo).length === 0) return undefined

  const parsed = seoObject.safeParse(seo)
  if (!parsed.success) {
    notes.push({
      element: 'seo',
      detail: `dropped an seo object that failed its gate: ${description}`,
    })
    return undefined
  }
  return seo
}

/**
 * One parsed o3xo.ai page → one insight document, or the reasons it cannot be
 * one. Fail-loud like every mapper (ADR 0002): a missing body or a path that
 * would move stops the run rather than committing a document with a hole in it.
 */
export function mapFramerInsight(
  src: FramerInsightRecord,
  options: FramerMapOptions,
): Mapped<InsightDoc> {
  const issues: ConversionIssue[] = []
  const notes: ConversionIssue[] = []
  const nextKey = createKeyGenerator()

  const body = convertHtml(src.bodyHtml, issues, nextKey, notes, {
    marker: '_srcUrl',
    normalizeUrl: assetUrl,
  }) as Record<string, unknown>[]
  if (body.length === 0) issues.push({ element: 'body', detail: 'no convertible article body' })

  // The deck is the excerpt, and it has no second source: unlike WordPress
  // there is no `post_excerpt` and no separate summary field to fall back to.
  // Using the meta description instead would put search-result copy on the page.
  const excerpt = src.deck.trim()
  if (!excerpt)
    issues.push({ element: 'excerpt', detail: 'the hero has no deck under the headline' })

  const parity = checkPathParity(
    src.seo.canonicalRendered,
    `${options.insightPrefix}/${src.slug}`,
    'o3xo.ai',
  )
  if (parity) issues.push(parity)

  const publishedAt = syntheticPublishedAt({
    position: src.sitemapPosition,
    count: src.sitemapCount,
  })

  // Reported on every run, not once: the whole archive's dates are fabricated,
  // so the note is what keeps that in front of whoever runs the pipeline.
  notes.push({
    element: 'publishedAt',
    detail:
      `o3xo.ai publishes no date, so this one is synthetic — position ${src.sitemapPosition} ` +
      `of ${src.sitemapCount} in the sitemap, dated ${publishedAt} to order the collection`,
  })

  if (issues.length > 0) return failed(issues)

  const seo = mapFramerSeo(src.seo, notes)

  const doc = {
    _id: `insight-framer-${idKey(src.slug)}`,
    _type: 'insight' as const,
    title: src.title,
    slug: { _type: 'slug' as const, current: src.slug },
    excerpt,
    publishedAt,
    ...(src.category
      ? {
          categories: [
            {
              _type: 'reference' as const,
              _ref: `category-framer-${categoryKey(src.category)}`,
              _key: `cat-${categoryKey(src.category)}`,
            },
          ],
        }
      : { categories: [] }),
    ...(src.heroImage
      ? {
          featuredImage: {
            _type: 'figure',
            image: { _type: 'image', _srcUrl: src.heroImage.url },
            alt: src.heroImage.alt || src.title,
          },
        }
      : {}),
    body,
    ...(seo ? { seo } : {}),
    migration: {
      locked: false,
      // The CMS item id, not the slug: an editor can rename a slug, and the
      // provenance has to survive that. Slug-keyed only where Framer's
      // per-page props did not carry an id.
      sourceId: `framer:insight:${src.collectionItemId ?? src.slug}`,
    },
  }

  const parsed = insightDoc.safeParse(doc)
  if (!parsed.success) {
    return failed(
      parsed.error.issues.map((issue) => ({
        element: issue.path.join('.'),
        detail: issue.message,
      })),
    )
  }
  // The constructed literal, not zod's output: `body` and `featuredImage` are
  // typed loosely in the gate and parsing would widen the written JSON.
  return ok(doc, notes)
}
