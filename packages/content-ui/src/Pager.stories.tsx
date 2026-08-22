import { figmaDesign, O3XO_FIGMA_FILE_KEY } from '@o3/story-kit'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Pager } from './Pager'

/**
 * The collection index's numbered pager (`4404:1821`, Pagination canvas
 * `347:35854` of the _O3XO: UI kit_).
 *
 * Both brands render the component, so the Brand toolbar is the paint-leak
 * check: every colour it names is a role each token package defines.
 */
const meta = {
  title: 'Content/Pager',
  component: Pager,
  parameters: {
    layout: 'padded',
    design: figmaDesign('4404:1821', O3XO_FIGMA_FILE_KEY),
  },
  args: { href: (page: number) => (page <= 1 ? '/insights' : `/insights?page=${page}`) },
  argTypes: {
    page: { control: { type: 'number', min: 1 } },
    totalPages: { control: { type: 'number', min: 0 } },
  },
  globals: { backgrounds: { value: 'bone' } },
} satisfies Meta<typeof Pager>

export default meta
type Story = StoryObj<typeof meta>

/** The state the kit draws: page 1 of 6, `1 2 … 6 Next`. */
export const Default: Story = {
  args: { page: 1, totalPages: 6 },
}

/** Four pages, which is what the o3xo insights collection has — no elision. */
export const EveryPageFits: Story = {
  args: { page: 2, totalPages: 4 },
}

/** Both ends anchored, both gaps elided. The kit draws no frame for this. */
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
