import { defineField, defineType } from 'sanity'
import { ORB_SIZES, ORB_STATES } from '../../constants'

/**
 * An animated thought orb — `thinking-orbs` (MIT, orbs.jakubantalik.com)
 * drawn on a 2D canvas.
 *
 * **A shared object that doubles as a base block**, the way `figure`, `embed`
 * and `cta` already do: authors pick "Orb" from a `layoutSection` column, and
 * the same object is the optional mark on a `discipline` row. One definition,
 * so an orb is configured identically wherever it is placed.
 *
 * Every field is an author-facing knob on the library's own props. `state` is
 * the only one that changes what is drawn; the rest are pacing and placement,
 * and all carry an `initialValue` so an orb dropped in with no edits already
 * looks right.
 */
export const orb = defineType({
  name: 'orb',
  title: 'Orb',
  type: 'object',
  fields: [
    defineField({
      name: 'state',
      type: 'string',
      description: 'Which of the nine animations the orb draws.',
      options: { list: [...ORB_STATES] },
      initialValue: ORB_STATES[0],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'size',
      type: 'number',
      description:
        'The two tuned presets, in px. 64 is the avatar scale; 20 is the inline-status scale, a separate drawing rather than a shrunken one.',
      options: { list: [...ORB_SIZES], layout: 'radio', direction: 'horizontal' },
      initialValue: ORB_SIZES[0],
    }),
    defineField({
      name: 'speed',
      type: 'number',
      description: 'Multiplier on the animation’s baked speed — 1 is as tuned, 0.5 is half pace.',
      initialValue: 1,
      validation: (rule) => rule.min(0.1).max(4),
    }),
    defineField({
      name: 'paused',
      type: 'boolean',
      description:
        'Hold the animation on a frame. Motion is already skipped for anyone who asks for reduced motion — this is an editorial choice on top of that.',
      initialValue: false,
    }),
  ],
  preview: {
    select: { state: 'state', size: 'size' },
    prepare: ({ state, size }) => ({
      title: state ?? ORB_STATES[0],
      subtitle: `Orb · ${size ?? ORB_SIZES[0]}px`,
    }),
  },
})
