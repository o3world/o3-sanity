import { defineBlockKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'

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
    // No `defaultSurface` on the block it replaces, so the shorthand's own
    // default is written out — a converted block says which band colour it
    // paints rather than inheriting one nobody can see (#117).
    surfaceKnob({ initialValue: 'white' }),
  ],
})
