import { defineBlockKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'
import type { StatsSection } from '../types/generated'

/**
 * The stats band's design options.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 */
export const statsSectionKnobs = defineBlockKnobs({
  type: 'statsSection',
  title: 'Stats',
  tier: 'section',
  knobs: [
    knob({
      name: 'layout',
      title: 'Layout',
      description:
        'Columns lays the figures across the band, one per stat, and fits however many there are. Stacked runs them down a ruled column on the article measure — the shape that reads as part of the prose rather than as a break in it.',
      // Two shapes, not a column count: the row divides the band by how many
      // stats it was given, so a `columns` band with three figures and one
      // with four are the same option answered with different content. The
      // call `railPanelsSection.layout` makes.
      options: ['columns', 'stacked'],
      initialValue: 'columns',
    }),
    surfaceKnob({ initialValue: 'white' }),
  ],
  /**
   * Two stats rather than one: a lone figure reads as a mistake in a band
   * whose whole shape is a row, and two is the smallest thing that shows an
   * editor what they inserted. Both required fields are filled, and neither
   * value pretends to be real.
   */
  placeholder: {
    _type: 'statsSection',
    stats: [
      { _type: 'stat', _key: 'one', value: '00%', label: 'What the figure measures' },
      { _type: 'stat', _key: 'two', value: '00×', label: 'What the figure measures' },
    ],
  } satisfies StatsSection,
})
