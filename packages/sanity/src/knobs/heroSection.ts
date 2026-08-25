import { defineBlockKnobs, knob } from '@o3/block-spec'
import { decorationKnob } from './decoration'
import { surfaceKnob } from './surface'
import type { HeroSection } from '../types/generated'

/**
 * The hero's design options — the first block converted under ADR 0020.
 *
 * Read this file to know what the hero offers. The Sanity fields, and (from
 * #106) the canvas toolbar's controls, are generated from it, so neither can
 * offer a value this file does not list.
 */
export const heroSectionKnobs = defineBlockKnobs({
  type: 'heroSection',
  title: 'Hero',
  tier: 'section',
  knobs: [
    knob({
      name: 'variant',
      title: 'Composition',
      description:
        'Orbital is the Home opener — the full sphere band with the bone dome. Band is the interior-page hero: a shallow strip with an eyebrow over the headline, on ink or white.',
      // Home (1810:1616) against Work (1634:1181) / About (1924:5344) /
      // Solutions (1925:6141). Same block, two compositions — added in #42
      // as a field on the existing block rather than a second block type.
      options: ['orbital', 'band'],
      initialValue: 'orbital',
      // The axis that changes the most about what an editor is looking at, so
      // it goes on the hover bar rather than only in the menu.
      bar: true,
    }),
    knob({
      name: 'alignment',
      title: 'Alignment',
      description:
        'Band composition only. Left puts the copy against the gutter and leaves the right of the band to the globe or a rail; Centred stacks the eyebrow and the headline on the centre line, and nothing else fits beside them.',
      // Solutions (`1925:6141`) is the centred one — an eyebrow over a 650-wide
      // headline on the centre line, no standfirst, no rail, no globe. Every
      // other band instance draws the copy left (`2107:1051`, `2960:6876`).
      options: [
        { value: 'start', title: 'Left' },
        { value: 'center', title: 'Centred' },
      ],
      initialValue: 'start',
      // The orbital opener is centred by its own composition and has no second
      // arrangement to offer, so the axis belongs to `band` alone.
      showWhen: { at: 'variant', mode: 'oneOf', values: ['band'] },
    }),
    // The same knob the quote and CTA bands carry, with the hero's own list.
    // Was declared inline here while `decorationField()` still served the other
    // two; #120 converted them, so the shared meaning moved to the pure side
    // and the factory that generated a field directly is gone.
    //
    // Gated, because the centred band has nowhere to hang a sphere: the copy
    // owns the middle and the frame draws no art beside it. Without the gate
    // this is a control that turns and repaints nothing, which is what ADR
    // 0020's guard exists to remove. `emptyMatches` because `alignment` is
    // unset on every document saved before it existed, and on the orbital
    // opener, which the gate above closes.
    {
      ...decorationKnob(['orbs', 'none']),
      showWhen: { at: 'alignment', mode: 'oneOf', values: ['start'], emptyMatches: true },
    },
    /*
     * Ink or a light band, and only on the band composition (#311).
     *
     * The orbital opener paints ink whatever a document stores, and it has to:
     * the sphere and the white copy over it are one composition drawn on that
     * colour. So the control is gated rather than offered and ignored — a knob
     * that turns and repaints nothing is the failure ADR 0020's guard exists
     * to remove.
     *
     * The `Interior Hero` set is instanced on ink everywhere but About, which
     * draws "Interior Hero – White" (`2960:6876`, and `2975:9022` at 402) —
     * a set whose fill is **#F5F4F1** despite the name, which is `paper`.
     * White stays on the roster for a band that wants the plain one.
     *
     * `emptyMatches` is not set: `variant` defaults to `orbital`, so an unset
     * value is the composition this gate is closed for.
     */
    surfaceKnob({
      options: ['ink', 'white', 'paper'],
      initialValue: 'ink',
      showWhen: { at: 'variant', mode: 'oneOf', values: ['band'] },
    }),
  ],
  /**
   * A hero with one line in it and nothing to correct. `variant` is not spelled
   * here — the knob's own `initialValue` supplies it (`placeholder.ts`), so an
   * inserted hero opens orbital exactly as one created from the form does.
   */
  placeholder: {
    _type: 'heroSection',
    headlineLines: ['A headline for this hero.'],
    subheading: 'Add the line that sits under it.',
  } satisfies HeroSection,
})
