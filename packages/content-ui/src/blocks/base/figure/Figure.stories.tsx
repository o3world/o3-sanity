import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { seedImage } from '../../../testing/seedContent'

import { Figure } from './Figure'

/**
 * An image with **required** alt text and an optional caption.
 *
 * The alt requirement is a schema rule, not a renderer one, so the interesting
 * story here is `NoImage`: an editor can save a figure whose asset upload
 * failed, and the block has to render nothing rather than a broken box holding
 * a caption under it.
 *
 * Images come from the committed asset manifest, so these are the real
 * uploaded files rather than placeholders.
 */
const meta = {
  title: 'Content/Blocks/Base/Figure',
  component: Figure,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Figure>

export default meta
type Story = StoryObj<typeof meta>

const IMAGE = seedImage('tools/migration/data/seed/assets/insight-weekend-hero.png')

export const WithCaption: Story = {
  args: {
    image: IMAGE,
    alt: 'A dark field of thin rectangular outlines snapping into alignment left to right.',
    caption: 'The design took a month. The build took a weekend.',
  },
}

/** No caption — the 12px gap under the image must close. */
export const NoCaption: Story = {
  args: {
    image: IMAGE,
    alt: 'A dark field of thin rectangular outlines snapping into alignment left to right.',
  },
}

/** A long caption wrapping under a wide image. */
export const LongCaption: Story = {
  args: {
    image: IMAGE,
    alt: 'A dark field of thin rectangular outlines snapping into alignment left to right.',
    caption:
      'Sixty-nine commits, two hundred and seventy-two posts moved off WordPress, and a site that matches the design frame for frame — which is less a story about speed than about how few decisions were left open by the time the build started.',
  },
}

/** A portrait asset in the same slot — the block does not crop, so it is tall. */
export const Portrait: Story = {
  args: {
    image: seedImage('tools/migration/data/seed/assets/about-beyond-1682.png'),
    alt: 'A framed still from the 1682 conference.',
  },
}

/**
 * No image. Reachable (an upload that never landed), and the block must render
 * nothing at all rather than a caption floating under empty space.
 */
export const NoImage: Story = {
  args: { image: undefined, alt: 'Nothing to show', caption: 'This caption should not appear.' },
}
