import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { PageMockup } from '../PageMockup'

/** Authored About page beside the current desktop and mobile Figma frames. */
const meta = {
  title: 'Pages/About',
  component: PageMockup,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('3754:78274'),
  },
} satisfies Meta<typeof PageMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { page: 'about' },
  globals: { viewport: { value: 'desktop' } },
}

export const Mobile: Story = {
  args: { page: 'about' },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('3883:16493') },
}
