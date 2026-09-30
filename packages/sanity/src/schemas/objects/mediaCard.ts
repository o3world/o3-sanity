import { defineField } from 'sanity'
import { defineSharedObject } from './defineSharedObject'
import { mediaCardKnobs } from '../../knobs/mediaCard'

/**
 * The About frame's "Beyond O3 World" cards (`1924:5388`, #305): a picture,
 * the name of the thing, a line about it, and the link out.
 *
 * A base block rather than a band of its own, because the band around it is
 * already `layoutSection` — the eyebrow, the heading and the black surface are
 * its, and the columns are its `columns` knob. What the frame added is the
 * card, and a card composes.
 */
export const mediaCard = defineSharedObject({
  knobs: mediaCardKnobs,
  description:
    'A picture over a name, a line about it, and the link it exists to offer. Reach for it in a column when the thing being pointed at is a place a reader can go; the link is optional, and a card without one is a picture with a caption.',
  fields: [
    defineField({ name: 'media', type: 'figure', validation: (rule) => rule.required() }),
    'fit',
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
