import { defineBlockKnobs, knob } from '@o3/block-spec'
import { surfaceKnob } from './surface'

/**
 * The media band's design options — the block where one axis switches the
 * other one off.
 *
 * Read this file to know what the band offers. The Sanity fields, and the
 * canvas toolbar's controls, are generated from it, so neither can offer a
 * value this file does not list.
 */
export const mediaSectionKnobs = defineBlockKnobs({
  type: 'mediaSection',
  title: 'Media section',
  tier: 'section',
  knobs: [
    knob({
      name: 'variant',
      title: 'Variant',
      description:
        'Plain draws the figure itself. Capture floats a tall page screenshot on a dark stage and crops it at the band’s floor — the frame’s "here is the whole page" moment.',
      // `1647:1720` (#97): the same block, a different treatment — a 700px
      // dark band the capture is CROPPED by, rather than a figure sized to
      // its own aspect. A variant on the block instead of a second block,
      // the call `railPanelsSection.layout` and `heroSection.variant` make.
      options: ['plain', 'capture'],
      initialValue: 'plain',
    }),
    knob({
      name: 'width',
      title: 'Width',
      options: ['contained', 'full-bleed'],
      initialValue: 'contained',
      // A capture is a full-bleed stage by construction, so the axis has
      // nothing left to choose. Was `({parent}) => parent?.variant ===
      // 'capture'`. The gate lives on the knob rather than on a
      // `hiddenUnless` wrapper, because `width` is itself a design option:
      // the toolbar has to know not to draw it on a capture, and a closure
      // would tell it nothing (ADR 0020).
      showWhen: { at: 'variant', mode: 'notOneOf', values: ['capture'] },
    }),
    surfaceKnob({ initialValue: 'white' }),
  ],
})
