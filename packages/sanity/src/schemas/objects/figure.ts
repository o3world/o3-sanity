import { defineField, defineType } from 'sanity'

export const figure = defineType({
  name: 'figure',
  title: 'Image',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      validation: (rule) => rule.required().error('Alt text is required for accessibility.'),
    }),
    defineField({ name: 'caption', type: 'string' }),
  ],
  preview: {
    select: { title: 'alt', media: 'image' },
  },
})
