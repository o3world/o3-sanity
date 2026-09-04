import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { CarouselControl } from './carousel-control'

/**
 * The Home Blog's 48px Icon Button (`2134:1352`). Direction is the only axis;
 * disabled is the native state a carousel reaches at either end.
 */
const meta = {
  title: 'UI/CarouselControl',
  component: CarouselControl,
  parameters: {
    layout: 'centered',
    design: figmaDesign('2134:1352'),
  },
} satisfies Meta<typeof CarouselControl>

export default meta
type Story = StoryObj<typeof meta>

export const Next: Story = {
  args: { direction: 'next' },
}

/** The same glyph, rotated — not a second drawing. */
export const Prev: Story = {
  args: { direction: 'prev' },
}

/** How the pair actually ships: prev then next, on the heading row. */
export const Pair: Story = {
  args: { direction: 'prev' },
  render: () => (
    <div className="flex items-center gap-4">
      <CarouselControl direction="prev" />
      <CarouselControl direction="next" />
    </div>
  ),
}

/**
 * At the start of a rail. `disabled` drops the control to 40% — the control
 * stays visible so the rail's extent is legible, rather than disappearing and
 * shifting the row.
 */
export const AtTheStart: Story = {
  args: { direction: 'prev' },
  render: () => (
    <div className="flex items-center gap-4">
      <CarouselControl direction="prev" disabled />
      <CarouselControl direction="next" />
    </div>
  ),
}

/** On ink — the control is a fixed `surface-muted` fill, so it does not invert. */
export const OnInk: Story = {
  args: { direction: 'next' },
  globals: { backgrounds: { value: 'ink' } },
}
