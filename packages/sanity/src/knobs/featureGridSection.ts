import { defineBlockKnobs, knob } from '@o3/block-spec'
import { decorationKnob } from './decoration'
import { surfaceKnob } from './surface'
import type { FeatureGridSection } from '../types/generated'

/**
 * The feature band's design options.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 *
 * `layout` is read by more than the renderer: `features` validates its length
 * only on `orbital`, because the diagram has exactly four nodes drawn into it.
 * That rule stays a `validation` closure in the schema — a knob declares what
 * an editor may choose, not what the choice then requires of the rest of the
 * document.
 */
export const featureGridSectionKnobs = defineBlockKnobs({
  type: 'featureGridSection',
  title: 'Feature grid',
  tier: 'section',
  knobs: [
    knob({
      name: 'layout',
      title: 'Layout',
      description:
        'Grid pairs each mark with its copy, two across. Stack sets the mark above the copy, three across. Rows gives each feature a hairlined full-width row, heading left and body right. Orbital places exactly four on the dotted tetrahedron.',
      // Four arrangements of one shape — {mark, heading, body} — read off five
      // canonical bands: About's rows (`1925:5915`), Solutions' diagram
      // (`1928:6524`), and the partner page's "Why Sanity + O3" (`2354:2530`),
      // "What it enables." (`2334:2122`) and "Use cases." (`2341:2250`). Same
      // content, four compositions, which is a `layout` axis rather than four
      // blocks (#56, #47, #92).
      options: ['grid', 'stack', 'rows', 'orbital'],
      initialValue: 'grid',
      // The axis that changes the most about what an editor is looking at.
      bar: true,
    }),
    // `2354:2530` hangs the molecule off the right of the ink band at 25%,
    // where About and Solutions hang nothing. The band's list is the quote
    // band's minus `orbs` — no canonical feature band draws the sphere.
    decorationKnob(['none', 'molecule']),
    surfaceKnob({ initialValue: 'white' }),
  ],
  /**
   * One feature, not four. `features` requires exactly four on the `orbital`
   * layout and at least one otherwise, and the knob's default is `grid` — so
   * one is the smallest thing that satisfies what an inserted band actually is.
   * Switching to orbital then asks for three more, which is the form telling
   * the truth about the diagram.
   */
  placeholder: {
    _type: 'featureGridSection',
    heading: 'A heading for this grid.',
    features: [
      {
        _key: 'first',
        _type: 'feature',
        heading: 'First feature',
        body: 'Add this feature’s copy.',
      },
    ],
  } satisfies FeatureGridSection,
})
