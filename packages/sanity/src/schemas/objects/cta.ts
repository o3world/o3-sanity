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
      description:
        'Solid dark on a light band, solid light on ink or over a card scrim, or ghost. There is no red button in the canonical frames — brand red arrives as a gradient.',
      // Figma's `Button / Solid` (136:754) fills plus `Button / Ghost`
      // (264:260). Renamed from brand|inverse|ghost in #42: the shipped
      // vocabulary named a red button the design does not have. See
      // docs/figma-components.md → "Button is divergent".
      options: { list: ['dark', 'light', 'ghost'], layout: 'radio' },
      initialValue: 'dark',
    }),
  ],
  preview: {
    select: { title: 'label', subtitle: 'href' },
  },
})
