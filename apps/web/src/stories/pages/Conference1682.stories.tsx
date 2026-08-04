import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { PageMockup } from '../PageMockup'

/**
 * `/1682-conference-ai-innovation`, from
 * `data/seed/page/1682-conference-ai-innovation.json`.
 *
 * **No canonical Figma frame** — see the note on `Pages/Contact`.
 *
 * The one seeded page whose `perspectivesCarouselSection` carries a **curated**
 * list rather than falling back to the latest feed, so it is where the
 * curated path gets exercised end to end: three named articles, dereferenced,
 * in the editor's order rather than by date.
 */
const meta = {
  title: 'Pages/1682 Conference',
  component: PageMockup,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PageMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { page: '1682-conference-ai-innovation' },
  globals: { viewport: { value: 'desktop' } },
}

export const Mobile: Story = {
  args: { page: '1682-conference-ai-innovation' },
  globals: { viewport: { value: 'mobile' } },
}
