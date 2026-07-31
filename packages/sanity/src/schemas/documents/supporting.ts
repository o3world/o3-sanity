import { defineArrayMember, defineField, defineType } from 'sanity'

export const person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'title', title: 'Role', type: 'string' }),
    defineField({ name: 'headshot', type: 'image', options: { hotspot: true } }),
  ],
  preview: { select: { title: 'name', subtitle: 'title', media: 'headshot' } },
})

export const client = defineType({
  name: 'client',
  title: 'Client',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'logo', type: 'image', validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: 'name', media: 'logo' } },
})

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: 'title' } },
})

export const industry = defineType({
  name: 'industry',
  title: 'Industry',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' }, validation: (rule) => rule.required() }),
  ],
  preview: { select: { title: 'title' } },
})

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', initialValue: 'O3' }),
    defineField({
      name: 'perspectivesLabel',
      type: 'string',
      initialValue: 'Insights',
      description: 'Display name for the Perspectives collection in nav and headings.',
    }),
    defineField({ name: 'navItems', type: 'array', of: [defineArrayMember({ type: 'cta' })] }),
    defineField({ name: 'primaryCta', type: 'cta', description: 'The nav’s "Let’s talk" button.' }),
    defineField({ name: 'footerTagline', type: 'text', rows: 2 }),
    defineField({ name: 'footerLinks', type: 'array', of: [defineArrayMember({ type: 'cta' })] }),
    defineField({
      name: 'socialLinks',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'socialLink',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'url', type: 'url', validation: (rule) => rule.required() }),
          ],
        }),
      ],
    }),
    defineField({ name: 'defaultSeo', type: 'seo' }),
  ],
  preview: { select: { title: 'title' }, prepare: (sel) => ({ title: sel.title ?? 'Site Settings' }) },
})
