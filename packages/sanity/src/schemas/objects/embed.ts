import { defineField, defineType } from 'sanity'

export const embed = defineType({
  name: 'embed',
  title: 'Video / embed',
  type: 'object',
  fields: [
    defineField({
      name: 'url',
      type: 'url',
      description: 'Video or oEmbed URL (YouTube, Vimeo, …).',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'caption', type: 'string' }),
  ],
})
