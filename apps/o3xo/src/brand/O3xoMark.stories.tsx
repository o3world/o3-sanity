import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { O3xoMark } from './O3xoMark'

/**
 * O3XO's mark, one story per state the `O3XO` component set draws
 * (`4212:374`, Logos canvas `4212:229` of the _O3XO: UI kit_ file).
 *
 * **The brand is pinned.** This component is O3XO's alone — its `2 color`
 * variant fills the mark in `accent`, a role only O3XO's token package
 * declares — so there is no question for the Brand toolbar to ask over it, and
 * pinning `globals.brand` is what greys the control out. The toolbar stays
 * live on the shared-package stories, where flipping the brand is the standing
 * paint-leak test (ADR 0028).
 */
const meta = {
  title: 'Brand/O3xoMark',
  component: O3xoMark,
  globals: { brand: 'o3xo' },
  parameters: { layout: 'centered' },
  argTypes: {
    layout: { control: 'inline-radio', options: ['horizontal', 'stacked'] },
    color: { control: 'inline-radio', options: ['twoColor', 'white', 'black'] },
    background: { control: 'boolean' },
    height: { control: { type: 'number' } },
  },
} satisfies Meta<typeof O3xoMark>

export default meta
type Story = StoryObj<typeof meta>

/** `2 color` (`4212:385`) — a white word beside an accent mark, so it needs ink under it. */
export const TwoColor: Story = {
  args: { color: 'twoColor', height: 64 },
  globals: { backgrounds: { value: 'ink' } },
}

/** `White` — the whole lockup in one ink, for a photo or a dark band. */
export const White: Story = {
  args: { color: 'white', height: 64 },
  globals: { backgrounds: { value: 'ink' } },
}

/** `Black` — the kit's logo black, `#030303`, which no palette role sits at. */
export const Black: Story = {
  args: { color: 'black', height: 64 },
}

/**
 * The Background axis. The plate is part of the mark rather than of the chrome
 * around it, so each variant brings the surface its ink needs — which is why
 * all three sit on one band here.
 */
export const Plated: Story = {
  args: { background: true, height: 56 },
  globals: { backgrounds: { value: 'bone' } },
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="flex flex-wrap items-center gap-6">
      <O3xoMark {...args} color="twoColor" />
      <O3xoMark {...args} color="white" />
      <O3xoMark {...args} color="black" />
    </div>
  ),
}

/**
 * The Layout axis — the stacked lockup (`4212:435`) is a square drawing, not
 * the horizontal one squeezed, so both are shown at one height.
 */
export const Stacked: Story = {
  args: { layout: 'stacked', height: 96 },
  globals: { backgrounds: { value: 'ink' } },
  parameters: { layout: 'padded' },
  render: (args) => (
    <div className="flex flex-wrap items-end gap-10">
      <O3xoMark {...args} layout="stacked" />
      <O3xoMark {...args} layout="horizontal" />
    </div>
  ),
}
