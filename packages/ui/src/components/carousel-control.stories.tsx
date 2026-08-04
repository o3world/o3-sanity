import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { CarouselControl } from './carousel-control'

/**
 * Figma's `Icon / Surface` (`778:1862`) — the 58px circle beside a carousel
 * heading, holding `Icon / Soft` (`1203:1227`) at 34.8px.
 *
 * The set ships a `State=Hover` variant; per ADR 0008 that is a pseudo-class
 * rather than a cva variant, so hover is a `hover:` utility and has no story
 * of its own. `direction` is the only axis, and `disabled` is the state a rail
 * at either end actually reaches.
 */
const meta = {
  title: 'UI/CarouselControl',
  component: CarouselControl,
  parameters: {
    layout: 'centered',
    design: figmaDesign('778:1862'),
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
 * At the start of a rail. `disabled` drops the circle to 40% — the control
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

/** On ink — the circle is a fixed `surface-muted` fill, so it does not invert. */
export const OnInk: Story = {
  args: { direction: 'next' },
  globals: { backgrounds: { value: 'ink' } },
}
