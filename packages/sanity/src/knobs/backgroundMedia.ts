import { defineObjectKnobs, knob } from '@o3/block-spec'

/**
 * The background media's design options — the one thing about a band's
 * photograph an editor decides.
 *
 * Declared against the object rather than against each band (ADR 0023): the
 * field is injected into every section block, so a knob hung off the blocks
 * would be sixteen copies of one roster. An instance is configured by its
 * component.
 *
 * It rides no bar. The bar carries the band's surface and the one axis that
 * changes what the block is (CONTEXT.md → Knobs); this is delivered in the
 * instance's own knob menu.
 */
export const backgroundMediaKnobs = defineObjectKnobs({
  type: 'backgroundMedia',
  title: 'Background',
  knobs: [
    knob({
      name: 'tint',
      title: 'Tint',
      description:
        'Dim lays the band’s own surface colour over the picture so the copy stays legible. None shows the picture as it is — reach for it when the picture is already dark enough to read over.',
      // The kit's "Banner Tint" (`4406:6598`) is the dim state: black at 39%
      // over the hero's video. Its photographic bands (`4406:6755`,
      // `4406:6954`) draw no tint at all, because O3XO's imagery is a
      // near-black starfield. Two states, drawn — so two options.
      options: ['dim', 'none'],
      // The safe answer for a picture nobody has looked at yet: a band whose
      // copy has disappeared into a bright photograph is the failure this
      // affordance would otherwise ship.
      initialValue: 'dim',
    }),
  ],
})
