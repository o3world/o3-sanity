import { defineField } from 'sanity'
import { ORB_STATES } from '../../constants'
import { markKnobs, ORB_ONLY } from '../../knobs/mark'
import { hiddenUnless } from '../blocks/knobFields'
import { defineSharedObject } from './defineSharedObject'

/**
 * The dotted circle a card, a row or a discipline sets beside its copy.
 *
 * **One type for both drawings.** The frames draw a halftone disc
 * (`1925:5922` at 138px, `1925:6068` at 70) and the site
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
 * `embed` and `button` already have: authors pick it from a `layoutSection`
 * column (titled "Orb" there — a mark on its own in a column is the animation,
 * not a bullet), and the same object is the mark field on four section blocks.
 * One definition, so a mark is configured identically wherever it is placed —
 * a sentence the registry's shape now enforces rather than asserts: `kind`,
 * `state` and `size` are declared once in `src/knobs/mark.ts`, keyed by this
 * type name, and their fields are generated from that declaration (ADR 0023).
 *
 * `speed` and `paused` are not design options — a free multiplier and a
 * boolean, neither a set an editor picks from — so they stay hand-written and
 * borrow the orb-only gate the knobs ride.
 */
export const mark = defineSharedObject({
  knobs: markKnobs,
  description:
    'The dotted circle set beside a piece of copy — an animated orb by default, or the frame’s original flat disc. Used two ways: as the mark field on a card, a row or a discipline, and on its own in a layout column, where it is the animation rather than a bullet. Same object either way, so it is configured identically wherever it sits.',
  fields: [
    'kind',
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
    select: { kind: 'kind', state: 'state' },
    prepare: ({ kind, state }) =>
      kind === 'disc'
        ? { title: 'Disc', subtitle: 'Halftone' }
        : { title: state ?? ORB_STATES[0], subtitle: 'Orb' },
  },
})
