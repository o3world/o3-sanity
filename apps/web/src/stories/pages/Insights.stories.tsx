import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { InsightIndexMockup } from '../InsightIndexMockup'

/** Current Insights index, including authored filtering and pagination. */
const meta = {
  title: 'Pages/Insights',
  component: InsightIndexMockup,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('3739:71101'),
  },
  argTypes: {
    category: {
      control: 'select',
      options: [null, 'artificial-intelligence-ai', 'innovation', 'research', 'technology'],
    },
    page: { control: { type: 'number', min: 1 } },
  },
} satisfies Meta<typeof InsightIndexMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { category: null },
  globals: { viewport: { value: 'desktop' } },
}

/**
 * The filtered index — `/insights/category/technology`, the state a chip
 * navigates to. Its chip is the only black one and the grid holds only what
 * that category has, which is the whole of what the control promises.
 */
export const Filtered: Story = {
  args: { category: 'technology' },
  globals: { viewport: { value: 'desktop' } },
}

/** One column, and the chip bar wrapping — the 402 index frame (`2975:8499`). */
export const Mobile: Story = {
  args: { category: null },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('2975:8499') },
}
