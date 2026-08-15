import { defineObjectKnobs, knob } from '@o3/block-spec'

/**
 * The button group's one design option (#149, ADR 0023).
 *
 * **Alignment and nothing else.** The group exists to arrange buttons, so the
 * only thing an editor decides about the group itself is where the row sits in
 * the column it was dropped into. What each button looks like is the button's
 * own declaration, read at every placement — a group that re-declared a fill
 * would be configuring its members from the outside, which is the thing ADR
 * 0023 forbids.
 *
 * **Direction is deliberately absent.** A vertical group is a different
 * drawing, and no canonical frame has one; adding the axis now would mean
 * guessing its spacing and its wrap behaviour from nothing. The day a frame
 * draws one, it is one more `knob()` here and one more `cva` key — which is the
 * cost this root exists to keep it at.
 *
 * The values are logical (`start` / `center` / `end`, straight onto the
 * flexbox keywords) and the titles are what an editor sees; this site is
 * single-direction, so "Left" is honest where "Start" would be a term nobody
 * asked to learn.
 *
 * Menu-only, like every instance knob — `barKnobs` never sees an object spec.
 */
export const buttonGroupKnobs = defineObjectKnobs({
  type: 'buttonGroup',
  title: 'Button group',
  knobs: [
    knob({
      name: 'alignment',
      title: 'Alignment',
      description: 'Where the row sits in the space it was given.',
      options: [
        { value: 'start', title: 'Left' },
        { value: 'center', title: 'Centred' },
        { value: 'end', title: 'Right' },
      ],
      initialValue: 'start',
    }),
  ],
})
