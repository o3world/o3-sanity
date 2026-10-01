import { defineField, defineType } from 'sanity'

/**
 * Per-document SEO overrides. Every field is an **override** — empty means
 * "use the derived default", never "emit nothing". The resolution chain lives
 * in `@o3/content-runtime/seo`: document `seo` → document fields → Site
 * Settings `defaultSeo`.
 *
 * The migrated documents follow the same rule: they carry only what a
 * WordPress post overrode in Yoast, not Yoast's resolved per-post values, which
 * would freeze 272 copies of the site default into the dataset.
 */
/**
 * The summary fields a route's metadata falls back to before Site Settings:
 * an insight's excerpt, a case study's narrative headline. A page has none,
 * so an empty description there always means the site-wide default.
 */
const OWN_SUMMARY_FIELDS = ['excerpt', 'narrativeHeadline'] as const

/**
 * The SEO description's warning. Empty is allowed — publishing is never
 * blocked — but a document with no summary of its own then shows the site-wide
 * default, the same text as every other page without one, and search engines
 * rewrite or ignore a description that many pages share.
 */
export function missingDescription(
  value: unknown,
  document: Record<string, unknown> | undefined,
): true | string {
  const written = (field: unknown) => typeof field === 'string' && field.trim() !== ''
  if (written(value)) return true
  if (OWN_SUMMARY_FIELDS.some((field) => written(document?.[field]))) return true
  return 'No description. Search results will show the site-wide default, shared by every page without one. Write one for this page, about 120–160 characters.'
}

export const seo = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      description:
        'Overrides the document title in search results and tabs. The site name is appended automatically — don’t include it.',
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      description:
        'Meta description, about 120–160 characters. Falls back to the document’s excerpt where it has one, then the site-wide default in Site Settings.',
      validation: (rule) =>
        rule
          .custom((value, context) =>
            missingDescription(value, context.document as Record<string, unknown> | undefined),
          )
          .warning(),
    }),
    defineField({
      name: 'ogImage',
      title: 'Social share image',
      type: 'image',
      description:
        'Falls back to the document’s hero image, then the Site Settings default. 1200×630 or larger.',
    }),
    defineField({
      name: 'canonical',
      title: 'Canonical URL',
      type: 'url',
      description:
        'Only set this when the page duplicates content that lives elsewhere. Left empty, a page is its own canonical.',
    }),
    defineField({
      name: 'noIndex',
      title: 'Hide from search engines',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'noFollow',
      title: 'Tell search engines not to follow links',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
