import { defineField, defineType } from 'sanity'

/**
 * Per-document SEO overrides. Every field is an **override** — empty means
 * "use the derived default", never "emit nothing". The resolution chain lives
 * in `apps/web/src/lib/seo.ts`: document `seo` → document fields → Site
 * Settings `defaultSeo`.
 *
 * The migrated documents follow the same rule: they carry only what a
 * WordPress post overrode in Yoast, not Yoast's resolved per-post values, which
 * would freeze 272 copies of the site default into the dataset.
 */
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
      description: 'Meta description. Falls back to the document’s excerpt, then Site Settings.',
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
