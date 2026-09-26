import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
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
  play: async ({ canvasElement }) => {
    const feed = canvasElement.querySelector('#feed')!
    const title = within(feed as HTMLElement).getAllByRole('heading', { level: 3 })[0]!
    await expect(getComputedStyle(feed).paddingTop).toBe('128px')
    await expect(getComputedStyle(title).fontSize).toBe('20px')
    await expect(getComputedStyle(title).lineHeight).toBe('28px')
    await expect(getComputedStyle(title.parentElement!).gap).toBe('8px')
  },
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
  play: async ({ canvasElement }) => {
    const feed = canvasElement.querySelector('#feed')!
    await expect(getComputedStyle(feed).paddingTop).toBe('24px')
    await expect(getComputedStyle(feed).paddingBottom).toBe('24px')
  },
  args: { category: null },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('2975:8499') },
}
