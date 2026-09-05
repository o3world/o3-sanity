import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seedImage, seededSectionArgs } from '../../../testing/seedContent'

import { CtaSection } from './CtaSection'

/**
 * The closing CTA band — the last thing on almost every page.
 *
 * It draws one of two generations, and they are not variations on a theme:
 *
 * - **`molecule`** is the canonical `CTA` component (`2124:72`), which the
 *   frames still instancing it draw override-free (`ctaSectionKnobs` says
 *   which). The mark sits centred at 53.9% of the band and 15% opacity, and
 *   the band closes flush.
 * - **`orbs`** is the bespoke Home band (`1680:2132`): the sphere run `soft`
 *   and centred, so the band shows its underside where the hero shows only the
 *   cap, plus the 172px fade strip (`1928:6596`) that melts its lower limb into
 *   the `#030303` footer. In a story there is no footer under it, so the strip
 *   reads as a band of its own — that is the story's limitation, not the
 *   component's. `Pages/Home` is where the join is actually visible.
 *
 * The CTA fill is forced to `light` for the same reason the nav forces its
 * own: this band always paints ink, which is why it offers no `surface`.
 */
const meta = {
  title: 'Content/Blocks/Section/CtaSection',
  component: CtaSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('2124:72'),
  },
  globals: { backgrounds: { value: 'ink' } },
} satisfies Meta<typeof CtaSection>

export default meta
type Story = StoryObj<typeof meta>

/** The About closer — the molecule, which is what a new band starts on. */
export const AsSeeded: Story = {
  args: seededSectionArgs('about', 'ctaSection'),
}

/** The Home closer, the one frame still on the sphere and its fade strip. */
export const Orbs: Story = {
  args: seededSectionArgs('index', 'ctaSection'),
  parameters: { design: figmaDesign('1680:2132') },
}

/** The sphere is `150vw` below `lg` against `90vw` above it. */
export const Mobile: Story = {
  parameters: { design: figmaDesign('2177:1353') },
  args: seededSectionArgs('index', 'ctaSection'),
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
}

/** Heading alone — the 600px column and its 18px gaps must not collapse. */
export const HeadingOnly: Story = {
  args: { ...seededSectionArgs('about', 'ctaSection'), body: undefined, button: null },
}

/** `decoration: 'none'` — the band with no field behind it and no strip. */
export const NoDecoration: Story = {
  args: { ...seededSectionArgs('about', 'ctaSection'), decoration: 'none' },
}

/**
 * The molecule at 402, which is the one band that keeps it there. The other
 * three hang a glyph measured in the frame's pixels and drop it below `lg`;
 * this one is sized in the band's own terms, so it has an honest small form.
 */
export const MoleculeMobile: Story = {
  args: seededSectionArgs('about', 'ctaSection'),
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
}

/**
 * The band on a picture (#303) — `backgroundMedia`, laid full-bleed under the
 * copy and tinted `bg-ink/40` so the 92% white heading keeps its contrast.
 *
 * The picture silences the decoration: the args still say `molecule`, and no
 * mark is drawn. Nothing can be both the background and the thing in front of
 * it.
 */
export const OnPhotograph: Story = {
  args: {
    ...seededSectionArgs('about', 'ctaSection'),
    backgroundMedia: {
      _type: 'backgroundMedia',
      image: seedImage('tools/migration/data/seed/assets/work-city.png'),
    },
  },
}
