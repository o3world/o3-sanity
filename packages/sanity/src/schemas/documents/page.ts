import { defineArrayMember, defineField, defineType } from 'sanity'
import { PAGE_TYPES } from '../../constants'
import { briefsField } from '../blocks/fields'
import { blockArrayMembers, type BlockArrays } from '../blocks/registry'

/**
 * A page, built from one roster's block arrays.
 *
 * A function rather than a constant because `sections` is the array a brand's
 * Studio differs in (ADR 0028, #251): the same declaration builds O3's page and
 * O3XO's, and `schemaTypesFor` is what decides which. Everything else about the
 * document is one model's, and reads the same in both.
 */
export const page = (arrays: BlockArrays) =>
  defineType({
    name: 'page',
    title: 'Page',
    type: 'document',
    fields: [
      defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
      defineField({
        name: 'slug',
        type: 'slug',
        options: { source: 'title' },
        description:
          'Multi-segment slugs carry the URL prefix: "services/ux-audit", "ventures/rec-philly". The homepage slug is "index".',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'pageType',
        type: 'string',
        options: { list: [...PAGE_TYPES] },
        initialValue: 'standard',
        validation: (rule) => rule.required(),
      }),
      defineField({
        name: 'card',
        type: 'object',
        description: 'How this page appears in listing sections.',
        hidden: ({ document }) => document?.pageType !== 'service',
        fields: [
          defineField({ name: 'shortTitle', type: 'string' }),
          defineField({ name: 'excerpt', type: 'text', rows: 2 }),
          defineField({ name: 'icon', type: 'image' }),
        ],
      }),
      defineField({
        name: 'sections',
        type: 'array',
        of: blockArrayMembers('page.sections', arrays).map((member) => defineArrayMember(member)),
      }),
      briefsField(),
      defineField({ name: 'seo', type: 'seo' }),
      defineField({ name: 'migration', type: 'migration' }),
    ],
    preview: {
      select: { title: 'title', subtitle: 'slug.current' },
    },
  })
