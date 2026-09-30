import { defineObjectKnobs, knob } from '@o3/block-spec'

export const mediaCardKnobs = defineObjectKnobs({
  type: 'mediaCard',
  title: 'Media card',
  knobs: [
    knob({
      name: 'fit',
      title: 'Image fit',
      description:
        'Crop fills the card around the image hotspot. Contain preserves the complete artwork on a black background, as in the O3XO business card (3813:93985).',
      options: ['crop', 'contain'],
      initialValue: 'crop',
    }),
  ],
})
