import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { MenuIcon } from './menu-icon'

const meta = {
  title: 'UI/Icons/MenuIcon',
  component: MenuIcon,
  parameters: {
    layout: 'centered',
    design: figmaDesign('3737:69134'),
  },
} satisfies Meta<typeof MenuIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { className: 'text-white' },
  globals: { backgrounds: { value: 'ink' } },
}

export const Flipped: Story = {
  args: { className: 'text-fg' },
  globals: { backgrounds: { value: 'bone' } },
}
