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
  description:
    'A column of prose — the body text a layout column carries. Reach for it for any paragraph that is not a band’s own heading or standfirst.',
  title: 'Rich text',
  fields: [defineField({ name: 'body', type: 'bodyText', validation: (rule) => rule.required() })],
  preview: { select: { title: 'body.0.children.0.text' } },
})

export const statGroup = defineBaseBlock({
  name: 'statGroup',
  description:
    'One to four stats in a row, each a large figure over its label. Reach for it when a claim lands harder as a number than as a sentence; the figures have to come from something real.',
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
