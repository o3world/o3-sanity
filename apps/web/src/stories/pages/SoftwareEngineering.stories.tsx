import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { PageMockup } from '../PageMockup'

/**
 * `/solutions/software-engineering` — the first service landing page, from
 * the frame `2360:2879` (#93; the frame is named "Solutions" in the file, but
 * it draws a standalone page under `/solutions/`, not the index). From
 * `data/seed/page/solutions-software-engineering.json`.
 *
 * Two things only this page draws:
 *
 * - `railPanelsSection` in its `grid` layout (`2358:2788`) — three service
 *   columns, each panel's details stacked under its heading;
 * - `layoutSection` with the molecule decoration (`2357:2690`) — the
 *   proof-point band, ink with the glyph hung off its right edge.
 *
 * The frame is 1440-only, so the mobile story is entirely ADR 0006 renderer
 * decisions — the columns stacking is the drawing to check there.
 */
const meta = {
  title: 'Pages/Software Engineering',
  component: PageMockup,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('2360:2879'),
  },
} satisfies Meta<typeof PageMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { page: 'solutions-software-engineering' },
  globals: { viewport: { value: 'desktop' } },
}

/** Below `lg` the service columns become one stack — no 402 frame to copy. */
export const Mobile: Story = {
  args: { page: 'solutions-software-engineering' },
  globals: { viewport: { value: 'mobile' } },
}
