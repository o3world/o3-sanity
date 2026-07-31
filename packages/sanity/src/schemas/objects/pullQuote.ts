import { defineField, defineType } from 'sanity'

export const pullQuote = defineType({
  name: 'pullQuote',
  title: 'Pull quote',
  type: 'object',
  fields: [
    defineField({ name: 'text', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({ name: 'attribution', type: 'string' }),
  ],
  preview: {
    select: { title: 'text', subtitle: 'attribution' },
  },
})
