import { defineBlockKnobs, knob } from '@o3/block-spec'
import { decorationKnob } from './decoration'
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
        'Orbital is the Home opener — the full sphere band with the bone dome. Band is the interior-page hero: a shallow ink-warm strip with an eyebrow.',
      // Home (1810:1616) against Work (1634:1181) / About (1924:5344) /
      // Solutions (1925:6141). Same block, two compositions — added in #42
      // as a field on the existing block rather than a second block type.
      options: ['orbital', 'band'],
      initialValue: 'orbital',
      // The axis that changes the most about what an editor is looking at, so
      // it goes on the hover bar rather than only in the menu.
      bar: true,
    }),
    // The same knob the quote and CTA bands carry, with the hero's own list.
    // Was declared inline here while `decorationField()` still served the other
    // two; #120 converted them, so the shared meaning moved to the pure side
    // and the factory that generated a field directly is gone.
    decorationKnob(['orbs', 'none']),
    // NO `surface`. The orbital band paints ink itself, whatever a document
    // stores, and it has to: the sphere, the bone-soft curve at its foot and
    // the white copy over both are one composition drawn on that colour. A
    // knob that turned and repainted nothing was the state of it before, and
    // that is the failure ADR 0020's guard exists to remove — a control exists
    // exactly when it does something.
  ],
  // The band paints ink itself — see the note beside the missing surface knob.
  paintsOwnSurface: 'ink',
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
