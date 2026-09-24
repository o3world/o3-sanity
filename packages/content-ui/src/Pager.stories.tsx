import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Pager } from './Pager'

/**
 * The collection index's numbered pager. No frame in the O3 design file draws
 * it, so the story has no Design tab.
 */
const meta = {
  title: 'Content/Pager',
  component: Pager,
  parameters: { layout: 'padded' },
  args: { href: (page: number) => (page <= 1 ? '/insights' : `/insights/page/${page}`) },
  argTypes: {
    page: { control: { type: 'number', min: 1 } },
    totalPages: { control: { type: 'number', min: 0 } },
  },
  globals: { backgrounds: { value: 'bone' } },
} satisfies Meta<typeof Pager>

export default meta
type Story = StoryObj<typeof meta>

/** Page 1 of 6: `1 2 … 6 Next`. */
export const Default: Story = {
  args: { page: 1, totalPages: 6 },
}

/** Four pages: every page fits, so nothing is elided. */
export const EveryPageFits: Story = {
  args: { page: 2, totalPages: 4 },
}

/** Both ends anchored, both gaps elided. */
export const DeepInALongCollection: Story = {
  args: { page: 12, totalPages: 23 },
}

/** The last page: Next is gone and the row ends on the current plate. */
export const LastPage: Story = {
  args: { page: 6, totalPages: 6 },
}

/** A collection that fits on one page renders nothing to navigate. */
export const OnePage: Story = {
  args: { page: 1, totalPages: 1 },
}
