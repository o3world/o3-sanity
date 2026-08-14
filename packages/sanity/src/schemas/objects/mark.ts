import { defineField, defineType } from 'sanity'
import { MARK_KINDS, ORB_SIZES, ORB_STATES } from '../../constants'

/**
 * The dotted circle a card, a row or a discipline sets beside its copy.
 *
 * **One type for both drawings.** The frames draw a halftone disc
 * (`1925:5922` at 138px, `1899:4245` at 113, `1925:6068` at 70) and the site
 * now draws an animated orb — `thinking-orbs` (MIT, orbs.jakubantalik.com),
 * nine tuned animations on a 2D canvas. Both answer the same question, so
 * they are one field with a `kind`, not two fields that can disagree. The
 * alternative — an optional `orb` that falls back to a disc — makes "which
 * mark is this?" a question about absence, and leaves every slot added later
 * silently on the old treatment.
 *
 * **The orb is the default.** A mark left unfilled, and an item with no mark
 * at all, both animate; `disc` is the deliberate choice back to the frame's
 * original.
 *
 * **A shared object that doubles as a base block**, the shape `figure`,
 * `embed` and `cta` already have: authors pick it from a `layoutSection`
 * column (titled "Orb" there — a mark on its own in a column is the animation,
 * not a bullet), and the same object is the mark field on four section blocks.
 * One definition, so a mark is configured identically wherever it is placed.
 */
export const mark = defineType({
  name: 'mark',
  title: 'Mark',
  type: 'object',
  fields: [
    defineField({
      name: 'kind',
      type: 'string',
      description: 'Orb is the animated canvas; disc is the frame’s static halftone.',
      options: { list: [...MARK_KINDS], layout: 'radio', direction: 'horizontal' },
      initialValue: MARK_KINDS[0],
    }),
    defineField({
      name: 'state',
      type: 'string',
      description: 'Which of the nine animations the orb draws.',
      options: { list: [...ORB_STATES] },
      initialValue: ORB_STATES[0],
      hidden: ({ parent }) => parent?.kind === 'disc',
    }),
    defineField({
      name: 'size',
      type: 'number',
      description:
        'Which tuning the orb draws with — the library’s two presets, in px. Beside copy the orb fills its slot, so this sets the texture (dot count and pace), not the diameter: 64 is the standard drawing, 20 the finer one.',
      options: { list: [...ORB_SIZES], layout: 'radio', direction: 'horizontal' },
      initialValue: ORB_SIZES[0],
      hidden: ({ parent }) => parent?.kind === 'disc',
    }),
    defineField({
      name: 'speed',
      type: 'number',
      description: 'Multiplier on the animation’s baked speed — 1 is as tuned, 0.5 is half pace.',
      initialValue: 1,
      validation: (rule) => rule.min(0.1).max(4),
      hidden: ({ parent }) => parent?.kind === 'disc',
    }),
    defineField({
      name: 'paused',
      type: 'boolean',
      description:
        'Hold the animation on a frame. Motion is already skipped for anyone who asks for reduced motion — this is an editorial choice on top of that.',
      initialValue: false,
      hidden: ({ parent }) => parent?.kind === 'disc',
    }),
  ],
  preview: {
    select: { kind: 'kind', state: 'state' },
    prepare: ({ kind, state }) =>
      kind === 'disc'
        ? { title: 'Disc', subtitle: 'Halftone' }
        : { title: state ?? ORB_STATES[0], subtitle: 'Orb' },
  },
})
