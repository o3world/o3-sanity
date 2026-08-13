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
    /**
     * THE NARRATIVE IS ONE INTERLEAVED ARRAY — ADR 0018.
     *
     * `chapters` and `extraSections` were two fields, and the frame
     * (`1710:2300`) alternates chapter → band → chapter → band, which two
     * fields cannot express. One array of `chapter` members and section
     * blocks can, and every band the case study needs is then a block any
     * page can compose too. The section members are derived from the registry
     * (`sectionBlockMembers`), never restated.
     */
    defineField({
      name: 'story',
      type: 'array',
      of: [
        defineArrayMember({ type: 'chapter' }),
        ...sectionBlockMembers.map((member) => defineArrayMember(member)),
      ],
      group: 'story',
      description:
        'The narrative in order — numbered chapters with whatever bands sit between them. Numbering derives from a chapter’s order among the other chapters, so a band between two chapters costs nothing.',
    }),
    defineField({
      name: 'deliverables',
      title: 'What we shipped',
      type: 'array',
      of: [{ type: 'string' }],
      group: 'story',
    }),
    defineField({ name: 'seo', type: 'seo' }),
    defineField({ name: 'migration', type: 'migration' }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'narrativeHeadline', media: 'heroMedia.image' },
  },
})
