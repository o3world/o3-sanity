import { defineArrayMember, defineField, defineType } from 'sanity'
import { sectionBlockMembers } from '../blocks/section'

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  groups: [
    { name: 'card', title: 'Card' },
    { name: 'story', title: 'Story' },
  ],
  fields: [
    defineField({ name: 'title', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: { source: 'title' },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'client',
      type: 'reference',
      to: [{ type: 'client' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'industries',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'industry' }] })],
    }),
    defineField({
      name: 'industryDetail',
      type: 'string',
      description:
        'The eyebrow’s second half, e.g. "Pediatric Systems" in "Healthcare · Pediatric Systems".',
    }),
    defineField({
      name: 'narrativeHeadline',
      type: 'text',
      rows: 3,
      group: 'card',
      description:
        'The problem-framing sentence shown on cards — "Families were navigating twelve portals…". Distinct from the title.',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'stats',
      type: 'array',
      of: [defineArrayMember({ type: 'stat' })],
      group: 'card',
      description: 'The first stat is the headline stat shown on showcase cards.',
    }),
    defineField({ name: 'heroMedia', type: 'figure', group: 'card' }),
    defineField({
      name: 'chapters',
      type: 'array',
      of: [defineArrayMember({ type: 'chapter' })],
      group: 'story',
      description: 'Numbered chapters ("01 — Overview"); numbering derives from order.',
    }),
    defineField({
      name: 'deliverables',
      title: 'What we shipped',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'story',
    }),
    defineField({
      name: 'extraSections',
      type: 'array',
      of: sectionBlockMembers.map((member) => defineArrayMember(member)),
      group: 'story',
      description: 'Optional per-case flourishes appended after the chapters.',
    }),
    defineField({ name: 'seo', type: 'seo' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'narrativeHeadline', media: 'heroMedia.image' },
  },
})
