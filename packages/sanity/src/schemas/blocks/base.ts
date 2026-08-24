import { defineField } from 'sanity'
import { defineBaseBlock } from './defineBlocks'

/**
 * Base-tier blocks. `figure`, `embed`, and `button` are shared objects that
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

/**
 * The About frame's "Beyond O3 World" cards (`1924:5388`, #305): a picture,
 * the name of the thing, a line about it, and the link out.
 *
 * A base block rather than a band of its own, because the band around it is
 * already `layoutSection` — the eyebrow, the heading and the black surface are
 * its, and the columns are its `columns` knob. What the frame added is the
 * card, and a card composes.
 */
export const mediaCard = defineBaseBlock({
  name: 'mediaCard',
  description:
    'A picture over a name, a line about it, and the link it exists to offer. Reach for it in a column when the thing being pointed at is a place a reader can go; the link is optional, and a card without one is a picture with a caption.',
  title: 'Media card',
  fields: [
    defineField({ name: 'media', type: 'figure', validation: (rule) => rule.required() }),
    defineField({ name: 'heading', type: 'string', validation: (rule) => rule.required() }),
    defineField({ name: 'body', type: 'text', rows: 2 }),
    defineField({
      name: 'button',
      type: 'button',
      description: 'Where the card goes. Leave it empty and the card draws no link.',
    }),
  ],
  preview: { select: { title: 'heading', subtitle: 'body', media: 'media.image' } },
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
