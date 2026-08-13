import { defineArrayMember, defineField, defineType } from 'sanity'

/**
 * A numbered case-study chapter ("01 — Overview / The Starting Line").
 * Numbering is derived from the chapter's position among the chapter members
 * of `caseStudy.story` (ADR 0018), never authored.
 */
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
    defineField({
      name: 'details',
      type: 'array',
      description:
        'Hairline term/description rows under the body — the frame’s breakdown table (`2274:4009`). The shipped case studies label them Strategy / Design / Research / Technology.',
      // Rows rather than a second body: `2274:4009` sets a fixed 180px term
      // column against a flowing description, which prose cannot express and
      // a table type would over-serve. `label` + `body` are the lexicon's own
      // names for the two halves.
      of: [
        defineArrayMember({
          type: 'object',
          name: 'detail',
          fields: [
            defineField({ name: 'label', type: 'string', validation: (rule) => rule.required() }),
            defineField({ name: 'body', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'label', subtitle: 'body' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'kicker' },
  },
})
