import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { BrandMark } from './brand-logo'

const meta = {
  title: 'UI/BrandMark',
  component: BrandMark,
  parameters: { layout: 'padded' },
  argTypes: {
    size: { control: { type: 'number' } },
  },
} satisfies Meta<typeof BrandMark>

export default meta
type Story = StoryObj<typeof meta>

/**
 * The ring and the superscript in `currentColor`, which is why it is shown on
 * both surfaces at once: the ink is the surface's to decide, and neither state
 * is the "default" one. This is what the nav draws (Nick's reference,
 * 2026-08-02); no Figma set instances a box-less mark.
 */
export const Mark: Story = {
  args: { size: 64 },
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
  args: { size: 148 },
  globals: { backgrounds: { value: 'ink' } },
  render: () => (
    <div className="flex items-start gap-6 text-white">
      <BrandMark trim size={148} />
      <BrandMark size={148} />
    </div>
  ),
}
