import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { PageMockup } from '../PageMockup'

/**
 * `/live` — the canonical Live frame (`1644:1889`, mobile `1906:334`), from
 * `data/seed/page/live.json`. ADR 0011 is why the route is called `live`.
 *
 * Three `inFlightSection` bands in a row, which is the whole point of this
 * mockup: the first is `cards`, the next two are `rows`, and the frame's own
 * deck names them — "the work in the studio, the rooms we'll be in, and the
 * ideas we're chasing". Whether three near-identical bands read as a rhythm or
 * as repetition is a page-level judgement, and this is where it is visible.
 */
const meta = {
  title: 'Pages/Live',
  component: PageMockup,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1644:1889'),
  },
} satisfies Meta<typeof PageMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { page: 'live' },
  globals: { viewport: { value: 'desktop' } },
}

/**
 * `1906:334`. The mobile rows drop the disc and the dot and collapse the date
 * onto one line — and the frames also drop the **arrow control**, which this
 * renderer deliberately keeps (shrunk) rather than leaving a row with no
 * visible affordance. ADR 0006 records the divergence; this is where to look
 * at it.
 */
export const Mobile: Story = {
  args: { page: 'live' },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1906:334') },
}
