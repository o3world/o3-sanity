import { defineArrayMember, defineField, defineType } from 'sanity'
import { briefsField } from '../blocks/fields'

import { isReservedCollectionSlug, RESERVED_SLUG_MESSAGE } from './reservedSlugs'

export const insight = defineType({
  name: 'insight',
  title: 'Insight',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) =>
        rule
          .required()
          .custom((slug) =>
            isReservedCollectionSlug(slug?.current) ? RESERVED_SLUG_MESSAGE : true,
          ),
    }),
    defineField({ name: 'excerpt', type: 'text', rows: 3, validation: (rule) => rule.required() }),
    defineField({
      name: 'author',
      type: 'reference',
      to: [{ type: 'person' }],
      description:
        'Optional. 232 of the 272 migrated articles have no byline — WordPress only ever showed one where an editor set the ACF author, and the detail page renders date and read time alone without it.',
    }),
    defineField({
      name: 'categories',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })],
    }),
    defineField({ name: 'publishedAt', type: 'datetime', validation: (rule) => rule.required() }),
    /**
     * The document's lead figure — the detail page's hero and nothing else.
     * Empty means nobody has chosen one yet, and the hero draws `cardMedia`
     * instead (#416).
     */
    defineField({ name: 'heroMedia', type: 'figure' }),
    /**
     * The figure this insight shows on cards and in feeds — the /insights
     * grid, the Insight Card wherever it appears, the related-articles
     * carousel. Empty means nobody has chosen one yet, and the card draws
     * `heroMedia` instead (#416).
     */
    defineField({ name: 'cardMedia', type: 'figure' }),
    /** Deprecated. Removed by #421, once no insight in either dataset defines it. */
    defineField({
      name: 'featuredImage',
      type: 'figure',
      deprecated: { reason: 'Use heroMedia for the lead figure, cardMedia for the card.' },
    }),
    defineField({ name: 'body', type: 'bodyText' }),
    briefsField(),
    defineField({ name: 'seo', type: 'seo' }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  orderings: [
    {
      title: 'Published, newest first',
      name: 'publishedAtDesc',
      by: [{ field: 'publishedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'title', subtitle: 'publishedAt', media: 'featuredImage.image' },
  },
})
