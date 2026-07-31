import { defineArrayMember, defineField, defineType } from 'sanity'

export const perspective = defineType({
  name: 'perspective',
  title: 'Perspective',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'excerpt', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: 'author',
      type: 'reference',
      to: [{ type: 'person' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'categories',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
    }),
    defineField({ name: 'publishedAt', type: 'datetime', validation: (rule) => rule.required() }),
    defineField({ name: 'featuredImage', type: 'figure' }),
    defineField({ name: 'body', type: 'bodyText' }),
    defineField({ name: 'seo', type: 'seo' }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  orderings: [
    {
      title: 'Published, newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'featuredImage.image' },
  },
})
