import { defineArrayMember, defineField, defineType } from 'sanity'
import { PAGE_TYPES } from '../../constants'
import { sectionBlockMembers } from '../blocks/section'

export const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      description:
        'Multi-segment slugs carry the URL prefix: "services/ux-audit", "ventures/rec-philly". The homepage slug is "index".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'pageType',
      type: 'string',
      options: { list: [...PAGE_TYPES], layout: 'radio', direction: 'horizontal' },
      initialValue: 'standard',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'card',
      type: 'object',
      description: 'How this page appears in listing sections.',
      hidden: ({ document }) => document?.pageType !== 'service',
      fields: [
        defineField({ name: 'shortTitle', type: 'string' }),
        defineField({ name: 'excerpt', type: 'text', rows: 2 }),
        defineField({ name: 'icon', type: 'image' }),
      ],
    }),
    defineField({
      name: 'sections',
      type: 'array',
      of: sectionBlockMembers.map((member) => defineArrayMember(member)),
    }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current' },
  },
})
