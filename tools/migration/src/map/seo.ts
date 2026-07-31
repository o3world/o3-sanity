import { z } from 'zod'

import { normalizeUploadUrl, type ConversionIssue } from '../lib/htmlToPortableText'
import type { WpSeo, WpSiteSeo } from '../lib/yoast'

/**
 * WordPress Yoast → the `seo` object, for every type (#26).
 *
 * One rule decides everything here: **`seo` holds overrides, never resolved
 * values.** Yoast hands us fully resolved output — the title with the site
 * name already appended, the site-wide OG image standing in for documents
 * that never picked one, `index,follow` spelled out on all 272 posts. Copying
 * that in would bake today's site defaults into 272 documents, so changing
 * the default later would mean editing every one of them. Instead each field
 * migrates only when the source document actually overrode it, and
 * `apps/web/src/lib/seo.ts` re-derives the rest at render time.
 *
 * The one transform that isn't a straight copy is the title: Yoast's resolved
 * title carries the ` | O3` suffix its template appends, and the Next.js root
 * layout appends the same suffix through `title.template`. Keeping both would
 * ship `Foo | O3 | O3`, so the site suffix is stripped here — using the
 * separator and site name the extract recorded, not a guessed regex.
 */

/**
 * The `seo` object as written into a converted document — the gate every
 * document type's zod schema reuses, so a mapper cannot invent a shape the
 * Studio schema does not have. Every key is optional: absent means "derive
 * it", and `false` booleans are never written.
 */
export const seoObject = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  ogImage: z.object({ _type: z.literal('image'), _wpSrc: z.string().url() }).optional(),
  canonical: z.string().url().optional(),
  noIndex: z.literal(true).optional(),
  noFollow: z.literal(true).optional(),
})

export type SeoObject = z.infer<typeof seoObject>

/**
 * Drop the ` <sep> <siteName>` tail Yoast's title template appends, so the
 * migrated title composes with the app's own `%s | O3` template instead of
 * doubling it. A title that doesn't end in the suffix is returned untouched.
 */
export function stripSiteSuffix(title: string, site: WpSiteSeo): string {
  const suffix = ` ${site.separator} ${site.siteName}`
  return title.endsWith(suffix) ? title.slice(0, -suffix.length).trim() : title.trim()
}

/**
 * Map one document's Yoast facts onto `seo`. Returns `undefined` when the
 * document overrode nothing — an empty `seo: {}` would be noise in the
 * committed JSON and identical in effect.
 *
 * `notes` collects source-quality observations: things the mapper normalized
 * rather than migrated, so a 272-document run reports them instead of
 * quietly improving the data (see `Mapped` in `types.ts`).
 */
export function mapSeo(
  src: WpSeo | undefined,
  site: WpSiteSeo,
  docTitle: string,
  notes: ConversionIssue[] = [],
): SeoObject | undefined {
  if (!src) return undefined

  const seo: SeoObject = {}

  // An override is a *template* too (`%%title%% %%sep%% %%sitename%%` is only
  // the default one), so take Yoast's expansion of it rather than the raw
  // string — but only when an override exists at all.
  if (src.titleOverride.trim()) {
    const title = stripSiteSuffix(src.titleRendered || src.titleOverride, site)
    if (title.includes('%')) {
      // An override whose expansion still has `%` in it is a broken template
      // an editor left behind (`%%title%% %%sep%% %%sitename%% % %`). The
      // default composition already produces what they were reaching for.
      notes.push({
        element: 'seo.title',
        detail: `dropped a broken Yoast title template: ${JSON.stringify(src.titleOverride)}`,
      })
    } else if (title && title !== docTitle.trim()) {
      seo.title = title
    }
    // A title override that resolves to the document's own title overrides
    // nothing — leaving the field empty says so, and keeps the Studio field
    // honestly blank.
  }

  if (src.descriptionOverride.trim()) seo.description = src.descriptionOverride.trim()

  // Yoast resolves `open_graph_images` through the site-wide default, so the
  // per-document override is read from postmeta instead (`yoast.ts`). Absent
  // one, the render-time chain falls through to the document's hero image and
  // then Site Settings — no per-document copy needed.
  if (src.ogImage?.url) {
    seo.ogImage = { _type: 'image', _wpSrc: normalizeUploadUrl(src.ogImage.url) }
  }

  // Never migrate `canonicalRendered`: a self-referential canonical pointing
  // at www.o3world.com would tell Google the new site is a duplicate of the
  // old one. Only an explicit cross-document override travels.
  if (src.canonicalOverride.trim()) seo.canonical = src.canonicalOverride.trim()

  if (src.noIndex) seo.noIndex = true
  if (src.noFollow) seo.noFollow = true

  return Object.keys(seo).length > 0 ? seo : undefined
}
