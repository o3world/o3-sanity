import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { PageMockup } from '../PageMockup'

/**
 * `/` — the canonical Home frame (`1680:2134`, mobile `1814:1618`).
 *
 * Eight bands off `data/seed/page/index.json`, in the seed's order: the
 * orbital hero, the partners wall, the case showcase, the pull quote, the two
 * rail-panel bands, the insights carousel and the closing CTA.
 *
 * The **surface sequence** is the thing this story shows that no block story
 * can: ink → bone → wash → bone → white → white → bone → ink. The hero's bone
 * dome only works because the band under it is bone, and the CTA band's fade
 * strip only works because the footer under it is `ink-deep`. Both are page
 * properties; change one band's surface and this is where it shows.
 */
const meta = {
  title: 'Pages/Home',
  component: PageMockup,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1680:2134'),
  },
} satisfies Meta<typeof PageMockup>

export default meta
type Story = StoryObj<typeof meta>

export const Desktop: Story = {
  args: { page: 'index' },
  globals: { viewport: { value: 'desktop' } },
}

/**
 * `1814:1618`. Every composition switch in the page fires between these two
 * stories — the nav collapses from a 1130px pill to a full-width bar, the hero
 * goes flush left, the logo wall drops to two across, and the rail panels
 * restack. ADR 0006 is the record of which of those are deliberate.
 */
export const Mobile: Story = {
  args: { page: 'index' },
  globals: { viewport: { value: 'mobile' } },
  parameters: { design: figmaDesign('1814:1618') },
}
