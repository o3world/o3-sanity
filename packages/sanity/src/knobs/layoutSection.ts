import { defineBlockKnobs, knob } from '@o3/block-spec'
import { decorationKnob } from './decoration'
import { surfaceKnob } from './surface'
import type { LayoutSection } from '../types/generated'

/**
 * The layout band's design options — the block that carries the repo's only
 * NUMBER-valued knob.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 */
export const layoutSectionKnobs = defineBlockKnobs({
  type: 'layoutSection',
  title: 'Layout section',
  tier: 'section',
  knobs: [
    knob({
      name: 'columns',
      title: 'Columns',
      // Declared as strings and stored as numbers. `valueType` is what makes
      // the generated field `type: 'number'` — the shape `generated.ts` already
      // publishes as `columns?: 1 | 2 | 3` and `LayoutSection` reads as a
      // number. Everything on this side of the seam stays a string, because
      // that is the one type gates and controls compare. The type is declared
      // and not inferred from the digits: see `KnobValueType`.
      valueType: 'number',
      options: ['1', '2', '3'],
      initialValue: '1',
    }),
    // The redesigned Solutions frame's proof-point band (`2357:2690`, #93)
    // hangs the molecule behind a layout band the way the partner page's
    // "Why Sanity + O3" hangs it behind a feature grid — same glyph, same
    // 25% weight, hung off the right edge.
    decorationKnob(['none', 'molecule']),
    // No `defaultSurface` on the block it replaces, so the shorthand's own
    // default is written out — a converted block says which band colour it
    // paints rather than inheriting one nobody can see (#117).
    surfaceKnob({ initialValue: 'white' }),
  ],
  /**
   * One `richText` item, because `items` declares `min(1)` and a layout band
   * with nothing in it is a gap on the page rather than a block. Its Portable
   * Text is written out longhand — a block, a span, the `markDefs` array the
   * type requires — because there is no builder on this side of the seam and
   * `@o3/block-spec` may not grow one.
   */
  placeholder: {
    _type: 'layoutSection',
    heading: 'A heading for this section.',
    subheading: 'Add the quieter line under it.',
    items: [
      {
        _key: 'first',
        _type: 'richText',
        body: [
          {
            _key: 'paragraph',
            _type: 'block',
            style: 'normal',
            markDefs: [],
            children: [
              { _key: 'text', _type: 'span', marks: [], text: 'Add the copy for this column.' },
            ],
          },
        ],
      },
    ],
  } satisfies LayoutSection,
})
