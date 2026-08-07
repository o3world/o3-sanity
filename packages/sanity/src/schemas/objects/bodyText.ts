import { defineArrayMember, defineType } from 'sanity'

/**
 * The shared Portable Text shape for insight bodies and case-study
 * chapters. Closed inline-object set per the schema spec: figure, embed,
 * pullQuote — and deliberately no codeBlock: extracting all 272 WordPress
 * bodies found zero `<pre>`, `<code>`, or highlighted blocks (ADR 0005).
 * The inline `code` decorator below covers naming a flag mid-sentence.
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
