import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, within } from 'storybook/test'
import { figmaDesign } from '@o3/story-kit'

import { seededSectionArgs } from '../../../testing/seedContent'

import { CarouselTrack } from './CarouselTrack'
import { InsightsCarouselSection } from './InsightsCarouselSection'

/**
 * The Home frame's "Blog" band (`2134:1352`) — a heading row with two
 * 48px controls, and a card rail under it.
 *
 * **The row bleeds past the right edge of the screen**, as the frame draws it.
 * The heading and the head of the row keep the standard structural column — at the
 * design width that is the frame's three visible cards — and only the track's
 * viewport reaches past the margin, so the fourth card crosses it.
 *
 * The query projects **both** a curated list and a latest fallback feed, and
 * curated wins when the editor picked any. Both arms have a story, because the
 * fallback is the one every page but `/1682-conference-ai-innovation` takes
 * and it is therefore the one that quietly rots.
 */
const meta = {
  title: 'Content/Blocks/Section/InsightsCarouselSection',
  component: InsightsCarouselSection,
  args: { headingSize: 'hero' },
  parameters: {
    layout: 'fullscreen',
    viewport: {
      options: { mobile: { name: 'Figma mobile', styles: { width: '402px', height: '874px' } } },
    },
    design: figmaDesign('2134:1352'),
  },
} satisfies Meta<typeof InsightsCarouselSection>

export default meta
type Story = StoryObj<typeof meta>

/** The homepage band: nothing curated, so the latest feed fills the rail. */
export const LatestFeed: Story = {
  args: seededSectionArgs('index', 'insightsCarouselSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    await expect(parseFloat(getComputedStyle(heading).fontSize)).toBeCloseTo(64, 1)
    await expect(parseFloat(getComputedStyle(heading).lineHeight)).toBeCloseTo(76, 1)
    await expect(getComputedStyle(heading).fontWeight).toBe('300')
  },
}

/** `/1682-conference-ai-innovation` — three articles named by the editor, in
 *  their order rather than by date. */
export const Curated: Story = {
  args: seededSectionArgs('1682-conference-ai-innovation', 'insightsCarouselSection'),
  globals: { backgrounds: { value: 'bone' } },
}

/** One card in the rail — the controls must not imply a scroll that isn't there. */
export const SingleCard: Story = {
  args: {
    ...seededSectionArgs('index', 'insightsCarouselSection'),
    latest: (seededSectionArgs('index', 'insightsCarouselSection').latest ?? []).slice(0, 1),
  },
  globals: { backgrounds: { value: 'bone' } },
}

/**
 * Neither curated nor latest. An empty feed is reachable — a category filter
 * that matches nothing — and it must not leave a heading over a void.
 */
export const EmptyFeed: Story = {
  args: {
    ...seededSectionArgs('index', 'insightsCarouselSection'),
    curated: [],
    latest: [],
  },
  globals: { backgrounds: { value: 'bone' } },
}

export const Mobile: Story = {
  args: seededSectionArgs('index', 'insightsCarouselSection'),
  globals: { backgrounds: { value: 'bone' }, viewport: { value: 'mobile' } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    await expect(parseFloat(getComputedStyle(heading).fontSize)).toBeCloseTo(40, 1)
    await expect(getComputedStyle(heading).fontWeight).toBe('300')
    await expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth)
  },
}

/** Insight detail retains the smaller heading through the track's default. */
export const KeepReading: Story = {
  args: seededSectionArgs('index', 'insightsCarouselSection'),
  render: () => <CarouselTrack heading="Keep reading." cards={[]} />,
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const heading = within(canvasElement).getByRole('heading', { level: 2 })
    await expect(parseFloat(getComputedStyle(heading).fontSize)).toBeCloseTo(48, 1)
    await expect(getComputedStyle(heading).fontWeight).toBe('300')
  },
}
