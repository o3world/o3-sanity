import { defineBlockKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'

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
    knob({
      name: 'decoration',
      title: 'Decoration',
      // No description, because the field it replaces had none — the shared
      // `decorationField()` factory says what the enum means in one place and
      // the two option labels say the rest. #113 converts the other two
      // blocks that call the factory and can retire it then.
      options: ['orbs', 'none'],
      initialValue: 'orbs',
    }),
    surfaceKnob({ initialValue: 'ink' }),
  ],
})
