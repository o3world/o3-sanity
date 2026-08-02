import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { BrandLogo } from './brand-logo'

const meta = {
  title: 'UI/BrandLogo',
  component: BrandLogo,
  parameters: { layout: 'padded' },
  argTypes: {
    color: { control: 'inline-radio', options: ['black', 'red', 'white'] },
    size: { control: { type: 'number' } },
  },
} satisfies Meta<typeof BrandLogo>

export default meta
type Story = StoryObj<typeof meta>

/** The NavBar mark — 64px, `#030303` square (`1710:2244`). */
export const Black: Story = {
  args: { color: 'black', size: 64 },
  globals: { backgrounds: { value: 'bone' } },
}

/** The footer mark — 176px, brand red (`1680:2099`). */
export const Red: Story = {
  args: { color: 'red', size: 176 },
  globals: { backgrounds: { value: 'ink' } },
}

/**
 * `264:53`, on a dark band — the exact mirror of `Black`, and the nav's
 * resting mark since the bar started reversing with the surface. Shown on ink
 * because that is the only place it is ever correct.
 */
export const White: Story = {
  args: { color: 'white', size: 64 },
  globals: { backgrounds: { value: 'ink' } },
}

/**
 * Figma's note on the set: scale it, don't restyle it. One `size` prop keeps
 * the square aspect ratio at any edge length.
 */
export const Scales: Story = {
  args: { color: 'red', size: 176 },
  render: () => (
    <div className="flex items-end gap-6">
      {[32, 48, 64, 96, 176].map((size) => (
        <BrandLogo key={size} color="red" size={size} />
      ))}
    </div>
  ),
}
