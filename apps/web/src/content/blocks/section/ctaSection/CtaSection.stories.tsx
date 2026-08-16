import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@/stories/seedContent'

import { CtaSection } from './CtaSection'

/**
 * The closing CTA band (`1680:2132`) — the last thing on almost every page.
 *
 * Two details this band exists to carry, and neither survives being looked at
 * in isolation for long:
 *
 * - the **87px fade strip** along the foot (`1928:6596`), which exists to melt
 *   the band into the `#030303` footer beneath it. In a story there is no
 *   footer under it, so the strip reads as a band of its own — that is the
 *   story's limitation, not the component's. `Pages/Home` is where the join
 *   is actually visible;
 * - the sphere runs `soft` and **centred**, so the band shows its underside,
 *   where the hero shows only the cap.
 *
 * The CTA fill is forced to `light` for the same reason the nav forces its
 * own: this band always paints ink, so `surface` never reaches it.
 */
const meta = {
  title: 'Content/Blocks/Section/CtaSection',
  component: CtaSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1680:2132'),
  },
  globals: { backgrounds: { value: 'ink' } },
} satisfies Meta<typeof CtaSection>

export default meta
type Story = StoryObj<typeof meta>

export const AsSeeded: Story = {
  args: seededSectionArgs('index', 'ctaSection'),
}

/** The sphere is `150vw` below `lg` against `90vw` above it. */
export const Mobile: Story = {
  args: seededSectionArgs('index', 'ctaSection'),
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
}

/** Heading alone — the 600px column and its 18px gaps must not collapse. */
export const HeadingOnly: Story = {
  args: { ...seededSectionArgs('index', 'ctaSection'), body: undefined, button: null },
}

/** `decoration: 'none'` — the band without its field, fade strip intact. */
export const NoDecoration: Story = {
  args: { ...seededSectionArgs('index', 'ctaSection'), decoration: 'none' },
}

/**
 * `decoration: 'molecule'` — what the canonical `CTA` component actually hangs
 * (`2124:72`): the mark at 54% of the band, centred, in place of the sphere.
 */
export const WithMolecule: Story = {
  args: { ...seededSectionArgs('index', 'ctaSection'), decoration: 'molecule' },
  parameters: { design: figmaDesign('2124:72') },
}

/**
 * The molecule at 402, which is the one band that keeps it there. The other
 * three hang a glyph measured in the frame's pixels and drop it below `lg`;
 * this one is sized in the band's own terms, so it has an honest small form.
 */
export const MoleculeMobile: Story = {
  args: { ...seededSectionArgs('index', 'ctaSection'), decoration: 'molecule' },
  globals: { backgrounds: { value: 'ink' }, viewport: { value: 'mobile' } },
}

/** The About page's closing band, for a second real string in the 446px measure. */
export const AboutVariant: Story = {
  args: seededSectionArgs('about', 'ctaSection'),
}
