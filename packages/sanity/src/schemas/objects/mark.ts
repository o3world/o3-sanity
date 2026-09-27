import { defineField } from 'sanity'
import { DOT_CIRCLE_ICONS, ORB_STATES } from '../../constants'
import { markKnobs, ORB_ONLY } from '../../knobs/mark'
import { hiddenUnless } from '../blocks/knobFields'
import { defineSharedObject } from './defineSharedObject'

/** Shared decorative artwork, also available as a base block in layout columns. */
export const mark = defineSharedObject({
  knobs: markKnobs,
  description:
    'A decorative mark set beside a piece of copy — an animated orb, halftone disc, authored illustration, or an animated Figma Dot Circle. Used two ways: as the mark field on a card, a row or a discipline, and on its own in a layout column, where it is the animation rather than a bullet. Same object either way, so it is configured identically wherever it sits.',
  fields: [
    'kind',
    defineField({
      name: 'media',
      title: 'Artwork',
      type: 'figure',
      description: 'The designed glyph or illustration, shown without cropping.',
      hidden: hiddenUnless({ at: 'kind', mode: 'oneOf', values: ['image'] }),
    }),
    'icon',
    'state',
    'size',
    defineField({
      name: 'speed',
      type: 'number',
      description: 'Multiplier on the animation’s baked speed — 1 is as tuned, 0.5 is half pace.',
      initialValue: 1,
      validation: (rule) => rule.min(0.1).max(4),
      hidden: hiddenUnless(ORB_ONLY),
    }),
    defineField({
      name: 'paused',
      type: 'boolean',
      description:
        'Hold the animation on a frame. Motion is already skipped for anyone who asks for reduced motion — this is an editorial choice on top of that.',
      initialValue: false,
      hidden: hiddenUnless(ORB_ONLY),
    }),
  ],
  preview: {
    select: { kind: 'kind', state: 'state', icon: 'icon' },
    prepare: ({ kind, state, icon }) =>
      kind === 'image'
        ? { title: 'Artwork', subtitle: 'Image' }
        : kind === 'disc'
          ? { title: 'Disc', subtitle: 'Halftone' }
          : kind === 'dotCircle'
            ? { title: icon ?? DOT_CIRCLE_ICONS[0], subtitle: 'Dot Circle' }
            : { title: state ?? ORB_STATES[0], subtitle: 'Orb' },
  },
})
