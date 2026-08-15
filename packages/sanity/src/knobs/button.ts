import { defineObjectKnobs, knob } from '@o3/block-spec'

/**
 * The button's design options (#145, ADR 0023) — the last of #113's closed
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
      name: 'contrast',
      title: 'Contrast',
      description:
        'How the button stands out from what is behind it. Auto reads the band underneath and picks the readable fill; the rest override it. There is no red button in the canonical frames — brand red arrives as a gradient.',
      /*
       * **Contrast, not variant** (ADR 0026). `variant` is already this repo's
       * word for the axis that changes what a block *is* — `heroSection`,
       * `mediaSection` and `collectionHero` all carry one — and an emphasis
       * axis added later beside a knob called `variant` would leave nobody
       * able to say which is which. The axis this names is the button's
       * relationship to its background, and that is what it is called.
       *
       * `auto` defers to `resolveContrast(stored, surface)` — the selector
       * exists and one of its options declines to answer, which is what makes
       * this a knob and a context-resolved value at once.
       *
       * The three fills are Figma's `Button` set (`2134:1785`) `Theme=Black` /
       * `Theme=White`, plus `Button / Ghost` (`264:260`). See
       * docs/figma-components.md → "Button is divergent".
       */
      options: ['auto', 'dark', 'light', 'ghost'],
      initialValue: 'auto',
    }),
    knob({
      name: 'icon',
      title: 'Icon',
      description:
        'What trails the label. The arrow is what a button carries unless you say otherwise, and None leaves the label bare.',
      /*
       * **A closed set, not a free icon name.** Figma's `Icon` set
       * (`2177:1556`) holds twenty-nine glyphs and a button trails three of
       * them; offering the rest would let an editor pick a shape no frame
       * draws. Each of these answers one of the destinations a button can
       * already have — an ordinary link, a URL that leaves the site, a place
       * further down this page — and `none` is the fourth answer rather than an
       * empty field.
       *
       * `arrow` is the default because every canonical instance of the `Button`
       * set (`2134:1785`) sets `Show Trailing Icon?` true, and because every
       * call site in `apps/web` set the boolean this replaces by hand.
       *
       * **The glyphs are drawn by the control, not by this file.** The knobs
       * directory is bundled into the Studio and into the preview overlay, so a
       * declaration that imported `@o3/ui` would drag the site's render layer
       * into both. `optionPreview: 'glyph'` says the option VALUES name icons;
       * the canvas is handed the map from names to components by the app, and
       * resolves them there.
       */
      optionPreview: 'glyph',
      options: [
        { value: 'arrow', title: 'Arrow' },
        { value: 'external', title: 'External link' },
        { value: 'down', title: 'Down' },
        { value: 'none', title: 'None' },
      ],
      initialValue: 'arrow',
    }),
  ],
})
