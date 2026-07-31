import { defineField, defineType } from 'sanity'

export const stat = defineType({
  name: 'stat',
  title: 'Stat',
  type: 'object',
  fields: [
    defineField({
      name: 'value',
      type: 'string',
      description: 'The headline figure — supports ranges like "89% → 114%".',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'label',
      type: 'string',
      description: 'What the figure measures, e.g. "fewer missed appointments".',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { title: 'value', subtitle: 'label' },
  },
})
