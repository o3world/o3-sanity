import { defineField } from 'sanity'

import { backgroundMediaKnobs } from '../../knobs/backgroundMedia'
import { defineSharedObject } from './defineSharedObject'

/**
 * THE PICTURE A BAND SITS ON — full-bleed behind the band's own copy, under
 * whatever surface colour the band declares.
 *
 * **`media` rather than `image`, because the field outlives the format.** The
 * kit's opener sits on a video (`4406:6597`) and five of its other bands on
 * stills; naming the object for the still would mean renaming it — and
 * re-migrating every document that carries one — the day the opener's video
 * lands. A second field beside `image` is what that costs instead.
 *
 * **No alt text, deliberately.** A background carries no information the
 * band's own copy does not already carry, so it renders decorative and a
 * screen reader passes over it. An alt field here would ask editors to
 * describe a texture, and the describing is what makes a decorative image
 * noisy rather than silent.
 */
export const backgroundMedia = defineSharedObject({
  knobs: backgroundMediaKnobs,
  description:
    'A picture the band sits on, full width and edge to edge, with the band’s copy over it. Reach for it on a band that should read as a place rather than as a panel. The band still declares a surface — it is what paints under the picture and what decides the colour of the tint over it, so pick the surface whose copy colour the picture can carry.',
  fields: [
    defineField({
      name: 'image',
      type: 'image',
      options: { hotspot: true },
      description:
        'The hotspot is what stays in frame: a band is a wide strip and a tall picture is cropped hard to fill it.',
    }),
    'tint',
  ],
  preview: { select: { media: 'image' } },
})
