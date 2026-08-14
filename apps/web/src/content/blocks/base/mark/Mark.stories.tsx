import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Mark } from './Mark'

/**
 * The dotted circle every card, row and discipline draws — and the base block
 * an editor drops into a `layoutSection` column on its own, where it is
 * titled "Orb".
 *
 * The stories are the values an editor can reach: the two `kind`s, the
 * animation knobs, and the empty case that proves the default. How the orb is
 * drawn lives in `UI/ThinkingOrb`.
 */
const meta = {
  title: 'Content/Blocks/Base/Mark',
  component: Mark,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Mark>

export default meta
type Story = StoryObj<typeof meta>

/** What dropping a mark in with no edits gives you. */
export const Default: Story = {
  args: { kind: 'orb', state: 'working', size: 64, speed: 1, paused: false },
}

/**
 * Every field empty — an item whose mark was never filled in, or content
 * authored before the field existed. It animates: the orb is the default, and
 * absence is not the disc.
 */
export const Unset: Story = {
  args: {},
}

/** The step back to the frame's halftone. */
export const Disc: Story = {
  args: { kind: 'disc', className: 'w-[138px]' },
}

/** At a slot's size — what a card or a row hands it. */
export const Filled: Story = {
  args: { kind: 'orb', state: 'connecting', className: 'w-[132px]' },
}

/** Half pace, for the editor who wants a slower mark. */
export const Slow: Story = {
  args: { kind: 'orb', state: 'weaving', size: 64, speed: 0.5, className: 'w-[132px]' },
}

export const Paused: Story = {
  args: { kind: 'orb', state: 'shaping', paused: true, className: 'w-[132px]' },
}

/** On ink — the orb inverts, and the disc inherits the band's white. */
export const OnInk: Story = {
  args: { kind: 'orb', state: 'searching', onInk: true, className: 'w-[132px]' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink flex items-center gap-8 p-12 text-white">
      <Mark {...args} />
      <Mark kind="disc" onInk className="w-[132px]" />
    </div>
  ),
}
