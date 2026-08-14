import { defineBlockKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'

/**
 * The discipline band's design options.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 *
 * `layout` is read by more than the two surfaces: `disciplines` validates its
 * length only on `orbital`, because the diagram has exactly four nodes drawn
 * into it. That rule stays a `validation` closure in the schema — a knob
 * declares what an editor may choose, not what the choice then requires of the
 * rest of the document.
 */
export const disciplineGridSectionKnobs = defineBlockKnobs({
  type: 'disciplineGridSection',
  title: 'Discipline grid',
  tier: 'section',
  knobs: [
    knob({
      name: 'layout',
      title: 'Layout',
      description:
        'Grid is the About band — a 2×2 of halftone-disc rows. Orbital is the Solutions centrepiece: the same four disciplines placed on a dotted tetrahedron.',
      // The same four disciplines appear twice in the canonical frames — as
      // rows on About (`1925:5915`) and as the diagram on Solutions
      // (`1928:6524`). Same content, two compositions, which is a `layout`
      // axis rather than a second block (#56, surfaced by #46 and #47).
      options: ['grid', 'orbital'],
      initialValue: 'grid',
    }),
    surfaceKnob({ initialValue: 'white' }),
  ],
})
