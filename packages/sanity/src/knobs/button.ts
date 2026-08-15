import { defineObjectKnobs, knob } from '@o3/block-spec'

/**
 * The button's one design option (#145, ADR 0023) — the last of #113's closed
 * sets to leave the schema and become a declaration.
 *
 * A `button` sits on eight blocks, inside three array members, in a layout
 * column and in the nav and footer. That is the argument for the root in one
 * line: the fill an editor picks is the same choice wherever the button
 * stands, so it is declared against the component and read at every placement.
 *
 * Menu-only, like every instance knob — `barKnobs` never sees an object spec.
 *
 * `label`, `target` and `href` stay hand-written in `button.ts`. `href`'s gate
 * stays a closure as well: it reads whether a REFERENCE is filled in, which no
 * `showWhen` mode expresses, and an editorial field is allowed one where a knob
 * is not (`insightsCarouselSection.category` is the same call).
 */
export const buttonKnobs = defineObjectKnobs({
  type: 'button',
  title: 'Button',
  knobs: [
    knob({
      name: 'variant',
      title: 'Variant',
      description:
        'Solid dark on a light band, solid light on ink or over a card scrim, or ghost. There is no red button in the canonical frames — brand red arrives as a gradient.',
      // Figma's `Button / Solid` (136:754) fills plus `Button / Ghost`
      // (264:260). See docs/figma-components.md → "Button is divergent".
      options: ['dark', 'light', 'ghost'],
      initialValue: 'dark',
    }),
  ],
})
