import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { CloseIcon } from './close-icon'

/**
 * Material Symbols Outlined `close`, inlined (ADR 0009). The canonical file
 * carries it inside `.building block Icon_text` (`136:14`) as the glyph named
 * `close` (`400:2219`).
 *
 * Filled with `currentColor` on the 24px Material grid — unlike `ArrowIcon`,
 * which strokes.
 */
const meta = {
  title: 'UI/Icons/CloseIcon',
  component: CloseIcon,
  parameters: {
    layout: 'centered',
    design: figmaDesign('136:14'),
  },
} satisfies Meta<typeof CloseIcon>

export default meta
type Story = StoryObj<typeof meta>

/** 20px — what a button draws its glyphs at (`136:14`). */
export const Default: Story = {
  args: { className: 'text-ink' },
}

export const OnInk: Story = {
  args: { className: 'text-white' },
  globals: { backgrounds: { value: 'ink' } },
}

export const Sizes: Story = {
  args: { className: 'text-ink' },
  render: () => (
    <div className="text-ink flex items-center gap-6">
      {[16, 20, 32, 48].map((size) => (
        <CloseIcon key={size} size={size} />
      ))}
    </div>
  ),
}
