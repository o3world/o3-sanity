import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Orb } from './Orb'

/**
 * Base block: an animated thought orb in a `layoutSection` column.
 *
 * The block is the schema's four knobs and nothing else — `state`, `size`,
 * `speed`, `paused` — so its stories are the values an editor can reach.
 * Everything about how the orb is drawn lives in `UI/ThinkingOrb`.
 */
const meta = {
  title: 'Content/Blocks/Base/Orb',
  component: Orb,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Orb>

export default meta
type Story = StoryObj<typeof meta>

/** What dropping an orb in with no edits gives you. */
export const Default: Story = {
  args: { state: 'working', size: 64, speed: 1, paused: false },
}

/** The inline-status preset. */
export const Small: Story = {
  args: { state: 'searching', size: 20, speed: 1, paused: false },
}

/** Half pace, held out for the editor who wants a slower mark. */
export const Slow: Story = {
  args: { state: 'weaving', size: 64, speed: 0.5, paused: false },
}

export const Paused: Story = {
  args: { state: 'shaping', size: 64, speed: 1, paused: true },
}

/**
 * Every field empty — the block still renders, because the wrapper's own
 * defaults stand in for an author who deleted the values the schema seeded.
 */
export const Unset: Story = {
  args: { state: undefined, size: undefined, speed: undefined, paused: undefined },
}
