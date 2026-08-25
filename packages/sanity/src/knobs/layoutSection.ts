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
    knob({
      name: 'bleed',
      title: 'Bleed',
      description:
        'Whether the last column runs off the right edge of the screen. It crops to the frame’s window, so give it a figure — and the columns beside it narrow to make room.',
      // The software-engineering page's intro band (`2360:2861`): a 395-wide
      // copy column and a photo whose box runs 474px past the frame's right
      // edge, cropped by it. `end` is the column the bleed is on rather than a
      // yes/no, so a left-bleeding band later is a value here and not a second
      // knob.
      options: [
        { value: 'none', title: 'None' },
        { value: 'end', title: 'Last column to the edge' },
      ],
      initialValue: 'none',
    }),
    knob({
      name: 'width',
      title: 'Width',
      description:
        'Section runs the standard 1248px column. Article insets the band to the 822px prose measure, for a header and running copy rather than a layout.',
      // About's "Why O3" (`2960:6885`) is the only band on a canonical frame
      // that insets itself — 340px of padding either side of a 1440 frame,
      // against the 96px gutter every other band on that page keeps. A knob
      // rather than a second block: the columns, the surface and the header
      // are all unchanged, and only the measure moves.
      options: ['section', 'article'],
      initialValue: 'section',
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
