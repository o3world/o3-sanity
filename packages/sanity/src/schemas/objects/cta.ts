import { defineField, defineType } from 'sanity'
import { ROUTABLE_TYPES } from '../../constants'

export const cta = defineType({
  name: 'cta',
  title: 'Call to action',
  type: 'object',
  fields: [
    defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'target',
      title: 'Internal target',
      type: 'reference',
      to: ROUTABLE_TYPES.map((type) => ({ type })),
      description: 'Pick an internal document — or leave empty and set an external URL.',
    }),
    defineField({
      name: 'href',
      title: 'External URL',
      type: 'url',
      validation: (rule) => rule.uri({ scheme: ['http', 'https', 'mailto'], allowRelative: true }),
      hidden: ({ parent }) => Boolean(parent?.target),
    }),
    defineField({
      name: 'variant',
      type: 'string',
      options: { list: ['brand', 'inverse', 'ghost'], layout: 'radio' },
      initialValue: 'brand',
    }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'href' },
  },
})
