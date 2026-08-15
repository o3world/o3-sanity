import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ArrowIcon } from './arrow-icon'

/**
 * The O3 arrow — inline SVG, not an icon font (ADR 0009). It strokes with
 * `currentColor`, so a story that wants to see it has to set a text colour;
 * that is the whole contract, and the stories below are the two places it is
 * actually used.
 */
const meta = {
  title: 'UI/Icons/ArrowIcon',
  component: ArrowIcon,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ArrowIcon>

export default meta
type Story = StoryObj<typeof meta>

/** 20px — the `Button` set's trailing-icon wrapper (`2134:1785`), and the default. */
export const Default: Story = {
  args: { className: 'text-ink' },
}

/** It follows `currentColor`, so it needs no inverse variant. */
export const OnInk: Story = {
  args: { className: 'text-white' },
  globals: { backgrounds: { value: 'ink' } },
}

/** The size prop is a plain px width/height — the glyph is scale-independent. */
export const Sizes: Story = {
  args: { className: 'text-ink' },
  render: () => (
    <div className="text-ink flex items-center gap-6">
      {[20, 24, 40, 64].map((size) => (
        <ArrowIcon key={size} size={size} />
      ))}
    </div>
  ),
}
