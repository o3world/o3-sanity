import { expect, within } from 'storybook/test'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CaseStudyHero } from './case-study-hero'

const meta = {
  title: 'Case Study/CaseStudyHero',
  component: CaseStudyHero,
  parameters: { layout: 'fullscreen' },
  // The title reaches its 48px cap at 1440, so the stories run at that width.
  globals: { viewport: { value: 'desktop' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(getComputedStyle(canvas.getByRole('heading', { level: 1 })).fontSize).toBe('48px')
    const eyebrow = canvasElement.querySelector('p')
    if (eyebrow) await expect(getComputedStyle(eyebrow).color).toBe('rgb(255, 255, 255)')
  },
} satisfies Meta<typeof CaseStudyHero>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Stand-in for the Sanity photograph — `packages/ui` has no image pipeline,
 * so the app passes a `SanityImage` into the same slot.
 */
const photograph = (
  <div className="h-full w-full bg-[radial-gradient(circle_at_30%_20%,#5a5a5a_0%,#141414_70%)]" />
)

/** The frames' own copy: a white kicker, the 48px title, the standfirst. */
export const Default: Story = {
  args: {
    eyebrow: 'IRONMAN',
    heading: 'Built for the long run.',
    subheading:
      "Transforming IRONMAN's digital experience with a faster, more flexible platform for athletes, fans, and the road ahead.",
    media: photograph,
  },
}

/** A case study with no narrative headline: the title holds the floor alone. */
export const TitleOnly: Story = {
  args: {
    eyebrow: 'La Colombe',
    heading: 'La Colombe',
    media: photograph,
  },
}

/**
 * With no hero image the band falls back to flat `ink-deep` — the scrim's own
 * base colour, so the copy stays legible rather than sitting on nothing.
 */
export const NoMedia: Story = {
  args: {
    eyebrow: 'La Colombe',
    heading: 'A storefront that sounds like the cafe',
    subheading:
      'La Colombe’s cafes and wholesale blends had built an outstanding brand experience that its digital storefront did not yet express.',
  },
}

/**
 * A screen shorter than the frame's 819: the band condenses to the viewport
 * rather than pushing its copy below the fold. The copy is bottom-aligned, so
 * the room it gives up is the space above it.
 */
export const ShortScreen: Story = {
  args: Default.args,
  parameters: {
    viewport: {
      options: {
        short: { name: 'Short 1440 × 700', styles: { width: '1440px', height: '700px' } },
      },
    },
  },
  globals: { viewport: { value: 'short' } },
  play: async ({ canvasElement }) => {
    const hero = canvasElement.querySelector('section')!
    const title = within(canvasElement).getByRole('heading', { level: 1 })
    await expect(hero.getBoundingClientRect().height).toBeLessThanOrEqual(window.innerHeight)
    await expect(title.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight)
  },
}
