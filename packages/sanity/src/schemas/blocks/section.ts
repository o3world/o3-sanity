import { defineArrayMember, defineField } from 'sanity'
import { defineSectionBlock } from './defineBlocks'
import { PAGE_TYPES } from '../../constants'

export const heroSection = defineSectionBlock({
  name: 'heroSection',
  title: 'Hero',
  defaultSurface: 'ink',
  fields: [
    defineField({
      name: 'headlineLines',
      title: 'Headline lines',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Each line animates in separately; the last line renders muted.',
      validation: (rule) => rule.required().min(1).max(3),
    }),
    defineField({ name: 'subheading', type: 'text', rows: 2 }),
    defineField({ name: 'cta', type: 'cta' }),
    defineField({
      name: 'decoration',
      type: 'string',
      options: { list: ['orbs', 'none'], layout: 'radio', direction: 'horizontal' },
      initialValue: 'orbs',
    }),
  ],
  preview: { select: { title: 'headlineLines.0' } },
})

export const logoWallSection = defineSectionBlock({
  name: 'logoWallSection',
  title: 'Logo wall',
  defaultSurface: 'bone',
  fields: [
    defineField({ name: 'eyebrow', type: 'string' }),
    defineField({
      name: 'statement',
      type: 'text',
      rows: 2,
      description: 'The large display statement above the logos.',
    }),
    defineField({
      name: 'clients',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'client' }] })],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'layout',
      type: 'string',
      options: { list: ['grid', 'marquee'], layout: 'radio', direction: 'horizontal' },
      initialValue: 'grid',
    }),
    defineField({ name: 'cta', type: 'cta' }),
  ],
  preview: { select: { title: 'statement' } },
})

export const caseShowcaseSection = defineSectionBlock({
  name: 'caseShowcaseSection',
  title: 'Case study showcase',
  defaultSurface: 'ink',
  fields: [
    defineField({ name: 'heading', type: 'string', initialValue: 'Our Work' }),
    defineField({ name: 'cta', type: 'cta' }),
    defineField({
      name: 'caseStudies',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'caseStudy' }] })],
      description:
        'Sticky-stacking cards; each pulls its narrative headline and headline stat from the case study.',
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: { select: { title: 'heading' } },
})

export const railPanelsSection = defineSectionBlock({
  name: 'railPanelsSection',
  title: 'Rail + panels',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'intro', type: 'text', rows: 3 }),
    defineField({
      name: 'panels',
      type: 'array',
      validation: (rule) => rule.required().min(2),
      of: [
        defineArrayMember({
          type: 'object',
          name: 'panel',
          fields: [
            defineField({
              name: 'railLabel',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({ name: 'heading', type: 'string' }),
            defineField({
              name: 'logo',
              type: 'image',
              description: 'Optional logo shown instead of the heading (platform panels).',
            }),
            defineField({ name: 'body', type: 'text', rows: 3 }),
            defineField({
              name: 'note',
              type: 'string',
              description: 'The quieter "Best when…" line.',
            }),
            defineField({ name: 'cta', type: 'cta' }),
            defineField({ name: 'media', type: 'figure' }),
          ],
          preview: { select: { title: 'railLabel' } },
        }),
      ],
    }),
  ],
  preview: { select: { title: 'heading' } },
})

export const quoteSection = defineSectionBlock({
  name: 'quoteSection',
  title: 'Quote',
  defaultSurface: 'bone',
  fields: [
    defineField({ name: 'quote', type: 'text', rows: 4, validation: (rule) => rule.required() }),
    defineField({
      name: 'attribution',
      type: 'string',
      description: 'e.g. "Business Leader, Global Health Brand".',
    }),
    defineField({
      name: 'decoration',
      type: 'string',
      options: { list: ['orbs', 'none'], layout: 'radio', direction: 'horizontal' },
      initialValue: 'orbs',
    }),
  ],
  preview: { select: { title: 'quote' } },
})

export const perspectivesCarouselSection = defineSectionBlock({
  name: 'perspectivesCarouselSection',
  title: 'Perspectives carousel',
  defaultSurface: 'bone',
  fields: [
    defineField({ name: 'heading', type: 'string', initialValue: 'The thinking behind the work.' }),
    defineField({
      name: 'perspectives',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'perspective' }] })],
      description: 'Leave empty to show the latest perspectives automatically.',
    }),
    defineField({
      name: 'category',
      type: 'reference',
      to: [{ type: 'category' }],
      description: 'When auto-filling, limit to this category.',
      hidden: ({ parent }) => Boolean(parent?.perspectives?.length),
    }),
  ],
  preview: { select: { title: 'heading' } },
})

export const ctaSection = defineSectionBlock({
  name: 'ctaSection',
  title: 'CTA',
  defaultSurface: 'ink',
  fields: [
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 2 }),
    defineField({ name: 'cta', type: 'cta' }),
    defineField({
      name: 'decoration',
      type: 'string',
      options: { list: ['orbs', 'none'], layout: 'radio', direction: 'horizontal' },
      initialValue: 'orbs',
    }),
  ],
  preview: { select: { title: 'heading' } },
})

export const layoutSection = defineSectionBlock({
  name: 'layoutSection',
  title: 'Layout section',
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'columns',
      type: 'number',
      options: { list: [1, 2, 3], layout: 'radio', direction: 'horizontal' },
      initialValue: 1,
    }),
    defineField({
      name: 'items',
      type: 'array',
      of: [
        defineArrayMember({ type: 'richText' }),
        defineArrayMember({ type: 'figure' }),
        defineArrayMember({ type: 'embed' }),
        defineArrayMember({ type: 'cta' }),
        defineArrayMember({ type: 'statGroup' }),
      ],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {
    select: { title: 'heading' },
    prepare: (sel) => ({ title: sel.title ?? 'Layout section' }),
  },
})

export const mediaSection = defineSectionBlock({
  name: 'mediaSection',
  title: 'Media section',
  fields: [
    defineField({ name: 'media', type: 'figure', validation: (rule) => rule.required() }),
    defineField({
      name: 'width',
      type: 'string',
      options: { list: ['contained', 'full-bleed'], layout: 'radio', direction: 'horizontal' },
      initialValue: 'contained',
    }),
  ],
  preview: { select: { title: 'media.alt' } },
})

export const listingSection = defineSectionBlock({
  name: 'listingSection',
  title: 'Listing',
  fields: [
    defineField({ name: 'heading', type: 'string' }),
    defineField({
      name: 'pageType',
      type: 'string',
      options: { list: [...PAGE_TYPES] },
      initialValue: 'service',
      description: 'Lists pages of this type via their card fieldset.',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'pageType' } },
})

export const sectionBlockMembers = [
  'heroSection',
  'logoWallSection',
  'caseShowcaseSection',
  'railPanelsSection',
  'quoteSection',
  'perspectivesCarouselSection',
  'ctaSection',
  'layoutSection',
  'mediaSection',
  'listingSection',
].map((type) => ({ type }))
