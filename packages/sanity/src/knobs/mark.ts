import { defineObjectKnobs, knob } from '@o3/block-spec'
import type { ShowWhen } from '@o3/block-spec'
import { MARK_KINDS, ORB_SIZES, ORB_STATES } from '../constants'

/**
 * The gate the orb's own options ride, and the one `speed` and `paused` borrow.
 *
 * Written down rather than closed over, which is the whole of what a shared
 * object gains from having a root (ADR 0020, ADR 0023): the form generates its
 * `hidden` predicate from this, and the canvas reads the same object. A
 * closure could only ever be called by the form, so a mark's options
 * disappeared from the canvas with nothing reporting it.
 *
 * `emptyMatches`, because `kind` defaults to `orb` and Sanity never writes an
 * `initialValue` into a document saved before the field existed — every mark
 * in the dataset today holds no `kind` and draws an orb.
 */
export const ORB_ONLY: ShowWhen = {
  at: 'kind',
  mode: 'oneOf',
  values: [MARK_KINDS[0]],
  emptyMatches: true,
}

/**
 * The mark's design options — the repo's first shared object to declare its own
 * (#145, ADR 0023).
 *
 * **Declared once, for every placement.** A mark is a field on four section
 * blocks, a member of `layoutSection.items`, and a field on the nav and the
 * footer outside the block tree. Hanging these off each host would be five
 * copies of one roster drifting apart with nothing failing — and could not
 * reach the polymorphic column at all. An instance is configured by its
 * component (CONTEXT.md → Component, instance, slot).
 *
 * None of them rides the bar. The bar carries the band's surface and the one
 * axis that changes what the BLOCK is (CONTEXT.md → Knobs), and `barKnobs`
 * never sees an object spec; a mark's options are delivered in the instance's
 * own knob menu.
 *
 * `speed` and `paused` are deliberately not here. Neither is a closed set — one
 * is a free multiplier and the other a boolean — so neither is a control an
 * editor picks a value from. They stay hand-written fields in `mark.ts` and
 * borrow this file's gate through `hiddenUnless`.
 */
export const markKnobs = defineObjectKnobs({
  type: 'mark',
  title: 'Mark',
  knobs: [
    knob({
      name: 'kind',
      title: 'Kind',
      description: 'Orb is the animated canvas; disc is the frame’s static halftone.',
      options: [...MARK_KINDS],
      initialValue: MARK_KINDS[0],
    }),
    knob({
      name: 'state',
      title: 'State',
      description: 'Which of the nine animations the orb draws.',
      options: [...ORB_STATES],
      initialValue: ORB_STATES[0],
      showWhen: ORB_ONLY,
    }),
    knob({
      name: 'size',
      title: 'Size',
      description:
        'Which tuning the orb draws with — the library’s two presets, in px. Beside copy the orb fills its slot, so this sets the texture (dot count and pace), not the diameter: 64 is the standard drawing, 20 the finer one.',
      // The field is `type: 'number'` and typegen publishes `64 | 20` into the
      // renderer's props, so the stored type is declared and never sniffed
      // (#119). Option values stay strings on this side of the seam.
      options: ORB_SIZES.map(String),
      initialValue: String(ORB_SIZES[0]),
      valueType: 'number',
      showWhen: ORB_ONLY,
    }),
  ],
})
