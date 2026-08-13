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

/**
 * `264:51` — brand red at 176px. It drew the footer until the 2026-08 rework
 * dropped the plate for the box-less mark below (#87).
 */
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
 * `trim` against the default box, at one `size`. The footer's Figma vector
 * (`1280:1856`) is bounded to the mark itself, so it needs the left one; the
 * nav's mark keeps the tile's margin, which is the right one.
 */
export const Trimmed: Story = {
  args: { color: 'black', size: 148 },
  globals: { backgrounds: { value: 'ink' } },
  render: () => (
    <div className="flex items-start gap-6 text-white">
      <BrandMark trim size={148} />
      <BrandMark size={148} />
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
