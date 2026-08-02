import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { BrandLogo, BrandMark } from './brand-logo'

const meta = {
  title: 'UI/BrandLogo',
  component: BrandLogo,
  parameters: { layout: 'padded' },
  argTypes: {
    color: { control: 'inline-radio', options: ['black', 'red'] },
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
 * `BrandMark` — the same two paths without the plate, in `currentColor`, which
 * is why it is shown on both surfaces at once: the ink is the surface's to
 * decide, and neither state is the "default" one. This is what the nav draws
 * (Nick's reference, 2026-08-02); no Figma set instances a box-less mark.
 */
export const Mark: Story = {
  args: { color: 'black', size: 64 },
  render: () => (
    <div className="flex gap-6">
      <div className="bg-ink flex items-center justify-center p-8 text-white">
        <BrandMark size={64} />
      </div>
      <div className="bg-bone text-fg flex items-center justify-center p-8">
        <BrandMark size={64} />
      </div>
    </div>
  ),
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
