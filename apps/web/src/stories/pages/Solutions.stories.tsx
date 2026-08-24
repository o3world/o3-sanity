import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { PageMockup } from '../PageMockup'

/**
 * `/solutions` — the canonical Solutions frame (`1925:6138`), from
 * `data/seed/page/solutions.json`. ADR 0013 is why this page exists at all
 * rather than a Services tree.
 *
 * One thing only this page draws:
 *
 * - `featureGridSection` in its `orbital` layout (`1928:6524`), the dotted
 *   tetrahedron. That composition is `lg` and up and falls back to the grid
 *   below it (ADR 0006), so this story at desktop and the same story at mobile
 *   are showing two genuinely different drawings rather than one reflowing.
 */
const meta = {
  title: 'Pages/Solutions',
  component: PageMockup,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1925:6138'),
  },
} satisfies Meta<typeof PageMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { page: 'solutions' },
  globals: { viewport: { value: 'desktop' } },
}

/** Below `lg` the tetrahedron becomes the grid — the fallback, seen whole. */
export const Mobile: Story = {
  args: { page: 'solutions' },
  globals: { viewport: { value: 'mobile' } },
}
