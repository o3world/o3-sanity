import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { PageMockup } from '../PageMockup'

/**
 * `/solutions` — the redesigned Solutions frame (`2360:2879`, ruled canonical
 * 2026-08-13, #93), from `data/seed/page/solutions.json`. ADR 0013 is why
 * this page exists at all rather than a Services tree.
 *
 * Two things only this page draws:
 *
 * - `railPanelsSection` in its `grid` layout (`2358:2788`) — the three
 *   service columns, each panel's details stacked under its heading;
 * - `layoutSection` with the molecule decoration (`2357:2690`) — the
 *   proof-point band, ink with the glyph hung off its right edge.
 *
 * The frame is 1440-only, so the mobile story is entirely ADR 0006 renderer
 * decisions — the columns stacking is the drawing to check there.
 */
const meta = {
  title: 'Pages/Solutions',
  component: PageMockup,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('2360:2879'),
  },
} satisfies Meta<typeof PageMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { page: 'solutions' },
  globals: { viewport: { value: 'desktop' } },
}

/** Below `lg` the service columns become one stack — no 402 frame to copy. */
export const Mobile: Story = {
  args: { page: 'solutions' },
  globals: { viewport: { value: 'mobile' } },
}
