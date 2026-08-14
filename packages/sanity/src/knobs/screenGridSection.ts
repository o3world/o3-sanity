import { defineBlockKnobs, defineItemKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { ScreenGridSection } from '../types/generated'

/**
 * One screen's design options — the first `item`-surface knobs in the repo
 * (#118, ADR 0021).
 *
 * Declared against the SCREEN, so `tone` is the member's own field and
 * `screens[].tone` is spelled nowhere. That is what makes every reader and
 * writer work unchanged: `visibleKnobs` resolves against one named screen
 * rather than returning a single answer for a grid of five, and `knobPatch`
 * takes the hovered member's keyed path as its root instead of writing into a
 * field literally called `screens[]` — which is what the block-rooted spelling
 * did, silently, before #122 gave the member a root.
 *
 * Neither rides the bar. The bar is a curated subset of the BLOCK's roster
 * (CONTEXT.md → Knobs) and `barKnobs` never sees an item spec, so a `bar: true`
 * here would be a declaration nothing reads. A screen's options are delivered
 * in the screen's own knob menu.
 */
export const screenKnobs = defineItemKnobs({
  type: 'screen',
  title: 'Screen',
  knobs: [
    knob({
      name: 'tone',
      title: 'Tone',
      description: 'The plate the screenshot sits on.',
      // `2230:7559` draws all three side by side, which is the frame saying
      // these are one axis rather than three tiles that happen to differ. The
      // plate is per-screen and not per-band: a grid mixes them (ADR 0007
      // reads `brand` as O3's own gradient, not the client's).
      options: ['ink', 'brand', 'bone'],
      initialValue: 'ink',
    }),
    knob({
      name: 'span',
      title: 'Span',
      description: 'Wide takes both columns — the frame’s lead tile.',
      // Plate HEIGHT follows from this rather than being a second option —
      // `2230:7559` is 716 for a wide tile and 342 for a small one — so the
      // grid's whole shape is this one pick per tile (ADR 0006).
      options: ['standard', 'wide'],
      initialValue: 'standard',
    }),
  ],
})

/**
 * The screen grid's design options — a band whose own roster is one knob, and
 * whose interesting ones belong to its tiles.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 *
 * `items` keys the member spec by the block-relative array field, and that key
 * is load-bearing in two places at once — here and in `section.ts`'s `screens`
 * field. Nothing checks that they agree (ADR 0021), because this directory may
 * not import `sanity` and so cannot see the schema; a typo files the spec under
 * an array that does not exist and the menu quietly offers a screen nothing.
 */
export const screenGridSectionKnobs = defineBlockKnobs({
  type: 'screenGridSection',
  title: 'Screen grid',
  tier: 'section',
  knobs: [surfaceKnob({ initialValue: 'white' })],
  items: { screens: screenKnobs },
  /**
   * One screen, because `screens` declares `min(1)` and the band renders
   * nothing without one. `tone` and `span` are not spelled here — the SCREEN's
   * own knobs supply them (ADR 0021, and `newBlockContent` applies a member's
   * defaults the same way it applies the block's).
   */
  placeholder: {
    _type: 'screenGridSection',
    screens: [
      {
        _key: 'first',
        _type: 'screen',
        media: { _type: 'figure', alt: 'Describe the screenshot that goes here.' },
      },
    ],
  } satisfies ScreenGridSection,
})
