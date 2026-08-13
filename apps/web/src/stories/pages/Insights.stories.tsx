import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { InsightIndexMockup } from '../InsightIndexMockup'

/**
 * `/insights` — the canonical index frame (`2336:4310`), the one #61
 * commissioned and the file gained on 2026-08-13.
 *
 * Four bands: the Interior Hero on ink, the bone Blog band holding the filter
 * bar over the card grid, the shared CTA, the footer. The **surface sequence**
 * is what only a page mockup shows — ink → bone → ink → black — and it is why
 * the grid band is bone rather than the white the Work index uses: two ink
 * bands with a white one between them would read as two pages.
 *
 * The other page-level property here is the filter bar's relationship to the
 * grid: 48px, close enough that the chips read as a control on the cards
 * rather than as a second band. The frame is emphatic about that gap.
 *
 * There is no 402 frame for any collection index (`docs/agents/figma.md`), so
 * the mobile story is a renderer decision (ADR 0006) rather than a
 * transcription: one column, the chips wrapping, the same 48px stack the Blog
 * band uses at 402.
 */
const meta = {
  title: 'Pages/Insights',
  component: InsightIndexMockup,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('2336:4310'),
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
 * The filtered index — `/insights?category=technology`, the state a chip
 * navigates to. Its chip is the only black one and the grid holds only what
 * that category has, which is the whole of what the control promises.
 */
export const Filtered: Story = {
  args: { category: 'technology' },
  globals: { viewport: { value: 'desktop' } },
}

/** One column, and the chip bar wrapping — no frame, ADR 0006. */
export const Mobile: Story = {
  args: { category: null },
  globals: { viewport: { value: 'mobile' } },
}
