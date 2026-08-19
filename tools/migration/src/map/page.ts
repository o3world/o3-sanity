import { z } from 'zod'

import { convertHtml, createKeyGenerator, type ConversionIssue } from '../lib/htmlToPortableText'
import type { WpSeo, WpSiteSeo } from '../lib/yoast'
import { checkPathParity, wpPath } from './paths'
import { mapSeo, seoObject } from './seo'
import { failed, ok, type ExtractMeta, type Mapped } from './types'

export interface WpPage {
  _meta: ExtractMeta
  wpId: number
  slug: string
  /** The URL WordPress serves, e.g. `/solutions/digital-experience-consulting-services/`. */
  path: string
  title: string
  parentSlug: string | null
  seo: WpSeo
  fields?: {
    page_header?: Record<string, unknown>[]
    flexible_content?: Record<string, unknown>[]
  }
}

/**
 * Which of the 22 published WordPress pages migrate (#18).
 *
 * The rule the extraction evidence supports: **migrate the pages whose value
 * is their exact words, and rebuild everything whose value is its design.**
 * A privacy policy is 17,000 characters nobody will retype and nobody should
 * paraphrase; a services page is a marketing argument the redesign is
 * deliberately re-making (#25 puts the homepage, about, solutions, campaigns,
 * the consolidated services story and ventures in the greenfield column).
 *
 * That leaves two, not the three-to-five the ticket estimated. Recorded here
 * rather than trimmed to fit the estimate:
 *
 * | Page                          | Content                          | Call        |
 * | ----------------------------- | -------------------------------- | ----------- |
 * | `privacy-policy`              | one `text` module, 17,202 chars  | **migrate** |
 * | `accessibility-statement`     | one `text` module, 1,985 chars   | **migrate** |
 * | `acquia-o3`, `sitecore`       | partner pages, `multiple_columns`| drop — the redesign's platforms are Sanity/Vercel/Lovable |
 * | `conversing-with-the-future…` | a 2023 event page with a form    | drop — ephemeral campaign |
 * | `error404`                    | empty; a header and nothing else | drop — 404 is a Next.js route, not a document |
 * | `contact`                     | one `form` module                | greenfield (#23) — no form block in the schema |
 * | `careers`                     | marketing + a Greenhouse feed    | greenfield (#23) |
 * | `home`, `about`, `solutions`, the three service children, `ventures`, `work`, `insights`, the 1682 pages, `community-engagement`, `1682-photos`, `lunch-and-learn…`, `mike-gadsby…` | design-led | greenfield (#23) or a listing route |
 *
 * Adding a page here is a decision, and it will fail loud if its modules have
 * no mapper — which is the point.
 */
export const KEEPER_SLUGS = ['privacy-policy', 'accessibility-statement'] as const

export const pageDoc = z.object({
  _id: z.string().regex(/^page-wp-\d+$/),
  _type: z.literal('page'),
  title: z.string().min(1),
  slug: z.object({ _type: z.literal('slug'), current: z.string().min(1) }),
  pageType: z.literal('standard'),
  sections: z.array(z.record(z.string(), z.unknown())).min(1),
  seo: seoObject.optional(),
  migration: z.object({ locked: z.boolean(), sourceId: z.string() }),
})

export type PageDoc = z.infer<typeof pageDoc>

/** `/privacy-policy/` → `privacy-policy`; `/solutions/x/` → `solutions/x`. */
export function slugFromPath(path: string, fallback: string): string {
  const trimmed = path.replace(/^\/+|\/+$/g, '')
  return trimmed || fallback
}

/**
 * The ACF `page_header` group's `basic_header` → a `heroSection`.
 *
 * `heroSection` is the only section block that renders an `<h1>`, so a page
 * without one has no document heading at all. `decoration: 'none'` because
 * the orbital motion vocabulary belongs on marketing pages — a privacy policy
 * with orbiting atoms is not what anyone means by "the design source of
 * truth".
 *
 * No `surface`. The hero declares `paintsOwnSurface: 'ink'`, so the band draws
 * its own colour and the block has no field to hold one; a stored surface is
 * content nothing reads.
 */
function headerSection(
  header: Record<string, unknown> | undefined,
  fallbackTitle: string,
  key: string,
): Record<string, unknown> {
  const titleRow = (header?.page_title_content as Record<string, unknown>[] | undefined)?.find(
    (row) => row.acf_fc_layout === 'title',
  )
  const headerTitle = typeof titleRow?.title === 'string' ? titleRow.title.trim() : ''
  // Same words, different capitalisation, in two WordPress fields: the
  // accessibility statement is "Accessibility statement" as a post and
  // "Accessibility Statement" in its header. The document title wins, so the
  // `<h1>` and the browser tab agree — importing that inconsistency would
  // just move it. A header that says something genuinely different is kept.
  const title =
    !headerTitle || headerTitle.toLowerCase() === fallbackTitle.toLowerCase()
      ? fallbackTitle
      : headerTitle
  const description =
    titleRow?.add_description && typeof titleRow.description === 'string'
      ? titleRow.description.trim()
      : ''

  return {
    _type: 'heroSection',
    _key: key,
    headlineLines: [title],
    ...(description ? { subheading: description } : {}),
    decoration: 'none',
  }
}

/**
 * One WordPress page → one `page` document, or the reasons it could not be
 * converted (ADR 0002).
 *
 * The module set is the fail-loud surface, as it is for insights: a
 * `flexible_content` layout with no arm here is reported, never dropped. Only
 * `text` has one, because only `text` appears on a keeper — adding another
 * page to `KEEPER_SLUGS` will surface exactly which modules it needs.
 */
export function mapPage(page: WpPage, site: WpSiteSeo): Mapped<PageDoc> {
  const issues: ConversionIssue[] = []
  const notes: ConversionIssue[] = []
  const nextKey = createKeyGenerator()
  const sections: Record<string, unknown>[] = []

  const header = (page.fields?.page_header ?? []).find(
    (row) => row.acf_fc_layout === 'basic_header',
  )
  sections.push(headerSection(header, page.title, nextKey()))

  for (const mod of page.fields?.flexible_content ?? []) {
    const layout = mod.acf_fc_layout as string
    if (layout === 'text') {
      const body = convertHtml(String(mod.text ?? mod.text_editor ?? ''), issues, nextKey, notes)
      if (body.length === 0) {
        issues.push({ element: 'acf module', detail: 'text module produced no body' })
        continue
      }
      // A full-width section wrapping one base block — the two-tier model
      // (ADR 0001) with nothing invented for it.
      sections.push({
        _type: 'layoutSection',
        _key: nextKey(),
        surface: 'white',
        columns: 1,
        items: [{ _type: 'richText', _key: nextKey(), body }],
      })
    } else {
      issues.push({ element: 'acf module', detail: `unmapped layout "${layout}"` })
    }
  }

  if (sections.length < 2) {
    issues.push({ element: 'sections', detail: 'nothing but a header converted' })
  }

  const slug = slugFromPath(page.path, page.slug)
  const parity = checkPathParity(page.seo?.canonicalRendered ?? '', `/${slug}`)
  if (parity) issues.push(parity)

  if (issues.length > 0) return failed(issues)

  const seo = mapSeo(page.seo, site, page.title, notes)

  const doc = {
    _id: `page-wp-${page.wpId}`,
    _type: 'page' as const,
    title: page.title,
    slug: { _type: 'slug' as const, current: slug },
    pageType: 'standard' as const,
    sections,
    ...(seo ? { seo } : {}),
    migration: {
      locked: false,
      sourceId: `wp:page:${page.wpId}`,
    },
  }

  const parsed = pageDoc.safeParse(doc)
  if (!parsed.success) {
    return failed(
      parsed.error.issues.map((i) => ({ element: i.path.join('.'), detail: i.message })),
    )
  }
  return ok(doc, notes)
}

/** Exported for the keeper-list test: the WP path a keeper is served at today. */
export function keeperPath(page: WpPage): string | null {
  return wpPath(page.seo?.canonicalRendered ?? '')
}
