import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CaseStudyHero } from './case-study-hero'

/**
 * The case-study opener, `1710:2301` at 1440 and `1906:923` at 402. At 1440 the
 * copy sits on a hard-edged black band running the width of the row
 * (`2846:4538`); at 402 there is none and the scrim carries the legibility on
 * its own. The kicker is brand red at both widths.
 */
const meta = {
  title: 'Case Study/CaseStudyHero',
  component: CaseStudyHero,
  parameters: { layout: 'fullscreen' },
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

/** The frames' own copy: a red kicker, the 64px Light title, the standfirst. */
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
