import { defineArrayMember, defineType } from 'sanity'

/**
 * The shared Portable Text shape for perspective bodies and case-study
 * chapters. Closed inline-object set per the schema spec: figure, embed,
 * pullQuote. A codeBlock is added only if extraction finds code in the
 * migrated WordPress bodies.
 */
export const bodyText = defineType({
  name: 'bodyText',
  title: 'Body',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: 'Normal', value: 'normal' },
        { title: 'H2', value: 'h2' },
        { title: 'H3', value: 'h3' },
        { title: 'Quote', value: 'blockquote' },
      ],
      marks: {
        decorators: [
          { title: 'Bold', value: 'strong' },
          { title: 'Italic', value: 'em' },
          { title: 'Code', value: 'code' },
        ],
      },
    }),
    defineArrayMember({ type: 'figure' }),
    defineArrayMember({ type: 'embed' }),
    defineArrayMember({ type: 'pullQuote' }),
  ],
})
