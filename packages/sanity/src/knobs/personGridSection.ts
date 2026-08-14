import { defineBlockKnobs } from '@o3/block-spec'
import { surfaceKnob } from './surface'

/**
 * The person grid's design options — `surface` and nothing else.
 *
 * The About band draws one grid of referenced people, and a person's card is
 * the same card however many the band holds. `white` is the default it has
 * always had: the block named no `defaultSurface`, and the shorthand's own
 * fallback was `white`, so a converted block has to say so out loud.
 */
export const personGridSectionKnobs = defineBlockKnobs({
  type: 'personGridSection',
  title: 'Person grid',
  tier: 'section',
  knobs: [surfaceKnob({ initialValue: 'white' })],
})
