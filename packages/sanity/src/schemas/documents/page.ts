import { defineArrayMember, defineField, defineType } from 'sanity'
import { PAGE_TYPES } from '../../constants'
import { briefsField } from '../blocks/fields'
import { blockArrayMembers } from '../blocks/registry'

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
      options: { list: [...PAGE_TYPES] },
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
      of: blockArrayMembers('page.sections').map((member) => defineArrayMember(member)),
    }),
    briefsField(),
    defineField({ name: 'seo', type: 'seo' }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'slug.current' },
  },
})
