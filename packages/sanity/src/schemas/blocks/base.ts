import { defineField } from 'sanity'
import { defineBaseBlock } from './defineBlocks'

/**
 * Base-tier blocks. `figure`, `embed`, and `cta` are shared objects that
 * double as base blocks — they're registered in BASE_BLOCKS and included in
 * layoutSection columns directly; only the types unique to the base tier are
 * defined here.
 */

export const richText = defineBaseBlock({
  name: 'richText',
  description: 'A column of prose — body text inside a layout-section column.',
  title: 'Rich text',
  fields: [defineField({ name: 'body', type: 'bodyText', validation: (rule) => rule.required() })],
  preview: { select: { title: 'body.0.children.0.text' } },
})

export const statGroup = defineBaseBlock({
  name: 'statGroup',
  description: 'One to four stats in a row — a big value over its label.',
  title: 'Stat group',
  fields: [
    defineField({
      name: 'stats',
      type: 'array',
      of: [{ type: 'stat' }],
      validation: (rule) => rule.required().min(1).max(4),
    }),
  ],
  preview: { select: { title: 'stats.0.value', subtitle: 'stats.0.label' } },
})
