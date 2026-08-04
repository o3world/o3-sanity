import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '@/stories/seedContent'

import { PerspectivesCarouselSection } from './PerspectivesCarouselSection'

/**
 * The Home frame's "Blog" band (`1683:2467`) — a heading row with two
 * `Icon / Surface` controls, and a card rail under it.
 *
 * **The frame's bleed is deliberately not kept.** It draws the row with no
 * side padding, running off the right edge; cards outside the margin read as a
 * layout mistake, and on a wide screen a gutter-only band grows far past the
 * content column. So the row lives in the standard 1248px column, which at the
 * design width is exactly the frame's three visible cards.
 *
 * The query projects **both** a curated list and a latest fallback feed, and
 * curated wins when the editor picked any. Both arms have a story, because the
 * fallback is the one every page but `/1682-conference-ai-innovation` takes
 * and it is therefore the one that quietly rots.
 */
const meta = {
  title: 'Content/Blocks/Section/PerspectivesCarouselSection',
  component: PerspectivesCarouselSection,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1683:2467'),
  },
} satisfies Meta<typeof PerspectivesCarouselSection>

export default meta
type Story = StoryObj<typeof meta>

/** The homepage band: nothing curated, so the latest feed fills the rail. */
export const LatestFeed: Story = {
  args: seededSectionArgs('index', 'perspectivesCarouselSection'),
  globals: { backgrounds: { value: 'bone' } },
}

/** `/1682-conference-ai-innovation` — three articles named by the editor, in
 *  their order rather than by date. */
export const Curated: Story = {
  args: seededSectionArgs('1682-conference-ai-innovation', 'perspectivesCarouselSection'),
  globals: { backgrounds: { value: 'bone' } },
}

/** One card in the rail — the controls must not imply a scroll that isn't there. */
export const SingleCard: Story = {
  args: {
    ...seededSectionArgs('index', 'perspectivesCarouselSection'),
    latest: (seededSectionArgs('index', 'perspectivesCarouselSection').latest ?? []).slice(0, 1),
  },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * Neither curated nor latest. An empty feed is reachable — a category filter
 * that matches nothing — and it must not leave a heading over a void.
 */
export const EmptyFeed: Story = {
  args: {
    ...seededSectionArgs('index', 'perspectivesCarouselSection'),
    curated: [],
    latest: [],
  },
  globals: { backgrounds: { value: 'bone' } },
}

export const Mobile: Story = {
  args: seededSectionArgs('index', 'perspectivesCarouselSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
}
