import { defineArrayMember, defineField, defineType } from 'sanity'

export const person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  fields: [
    defineField({ name: 'name', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'title', title: 'Role', type: 'string' }),
    defineField({ name: 'headshot', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'migration', type: 'migration' }),
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
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: { select: { title: 'name', media: 'logo' } },
})

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: { select: { title: 'title' } },
})

export const industry = defineType({
  name: 'industry',
  title: 'Industry',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: { select: { title: 'title' } },
})

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', initialValue: 'O3' }),
    // No collection-label field. It existed to render the collection as
    // "Insights" while the type was called `perspective`; now that the type is
    // `insight`, it translated a word into itself (ADR 0017). A nav item's own
    // `label` still overrides per link, like every other entry.
    /**
     * The brand-property strip above the nav pill (Figma `Utility Nav`,
     * `2250:1445`): O3 World, 1682 Conference, O3XO. Its own field rather than
     * a second `footerGroup` — the group's label has nowhere to go on a bar
     * that shows only its links, and the strip's membership is the set of
     * properties O3 runs, which is not the nav's concern.
     */
    defineField({
      name: 'utilityNavItems',
      title: 'Utility nav',
      type: 'array',
      of: [defineArrayMember({ type: 'button' })],
      description: 'The brand-property strip above the nav. Desktop only.',
    }),
    defineField({ name: 'navItems', type: 'array', of: [defineArrayMember({ type: 'button' })] }),
    defineField({
      name: 'primaryButton',
      type: 'button',
      description: 'The nav’s "Let’s talk" button.',
    }),
    defineField({ name: 'footerTagline', type: 'text', rows: 2 }),
    /**
     * The footer's labelled link columns, in order. The prototype's footer is
     * grouped ("Company", "Everything else"), not a flat list — a single
     * `footerLinks` array could not express it.
     */
    defineField({
      name: 'footerGroups',
      title: 'Footer link columns',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'footerGroup',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
            defineField({
              name: 'links',
              type: 'array',
              of: [defineArrayMember({ type: 'button' })],
            }),
          ],
          preview: { select: { title: 'label' } },
        }),
      ],
    }),
    defineField({
      name: 'socialsLabel',
      type: 'string',
      initialValue: 'Socials',
      description: 'Heading over the social links column.',
    }),
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
    defineField({
      name: 'legalLinks',
      type: 'array',
      of: [defineArrayMember({ type: 'button' })],
      description: 'Privacy, accessibility — the small print row beside the copyright.',
    }),
    defineField({
      name: 'legalName',
      type: 'string',
      description: 'The registered entity in the copyright line. The year is added automatically.',
    }),
    defineField({
      name: 'copyrightNote',
      type: 'string',
      description: 'Anything after "All rights reserved." — the prototype signs off "Go birds."',
    }),
    defineField({ name: 'defaultSeo', type: 'seo' }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: {
    select: { title: 'title' },
    prepare: (sel) => ({ title: sel.title ?? 'Site Settings' }),
  },
})
