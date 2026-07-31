import { defineField, defineType } from 'sanity'

/** A numbered case-study chapter ("01 — Overview / The Starting Line"). Numbering is derived from array order. */
export const chapter = defineType({
  name: 'chapter',
  title: 'Chapter',
  type: 'object',
  fields: [
    defineField({
      name: 'kicker',
      type: 'string',
      description: 'The label after the number, e.g. "Overview".',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'body', type: 'bodyText' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'kicker' },
  },
})
