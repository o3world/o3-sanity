import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { figmaDesign } from '@o3/story-kit'

import { CollectionHero } from './collection-hero'
import { OrbitalSphere } from './orbital-sphere'

/**
 * The interior-page opener, in the three compositions the canonical frames
 * draw it in. All three are the same band — `ink-warm`, 164px of clearance for
 * the floating pill — and differ only in `align` and what hangs behind it.
 *
 * Every story pins the ink background, because this band always paints its own
 * `#0F100B` and a white canvas behind it hides where the band actually ends.
 */
const meta = {
  title: 'UI/CollectionHero',
  component: CollectionHero,
  parameters: {
    layout: 'fullscreen',
    design: figmaDesign('1634:1181'),
  },
  globals: { backgrounds: { value: 'ink' } },
} satisfies Meta<typeof CollectionHero>

export default meta
type Story = StoryObj<typeof meta>

/**
 * `/work` (`1634:1181`) — the shape the component was built to: eyebrow and a
 * 48px headline left in a 588px measure, standfirst pinned right in 395px.
 */
export const Work: Story = {
  args: {
    eyebrow: 'Work',
    heading: 'The problems behind the problems.',
    subheading:
      'Every engagement here started as something else. What follows is what we found once we looked past the brief.',
  },
}

/**
 * `/about` (`1924:5344`) — the same left-aligned shape with the sphere hung
 * off the right edge, where the standfirst would otherwise sit. The decoration
 * is a slot rather than a prop, which is why the hero itself knows nothing
 * about spheres.
 */
export const AboutWithSphere: Story = {
  args: {
    eyebrow: 'About',
    heading: 'Senior people, on your problem, from the first conversation.',
    decoration: (
      <OrbitalSphere className="-z-10 hidden lg:bottom-[-30%] lg:right-[-14%] lg:block lg:w-[720px]" />
    ),
  },
}

/**
 * `/solutions` (`1925:6141`) — centred, which takes the headline to **60px**
 * in a 650px measure. The size follows the alignment because that is what the
 * two frames do; there is no centred 48px hero anywhere in the file.
 */
export const Centred: Story = {
  args: {
    eyebrow: 'Solutions',
    heading: 'Strategy, design, engineering and AI under one roof.',
    align: 'center',
  },
}

/**
 * A subheading with `align="center"` renders nothing — the centred frame has
 * no standfirst, and the component drops it rather than inventing a placement
 * for it. This story exists so that stays deliberate.
 */
export const CentredIgnoresSubheading: Story = {
  args: {
    eyebrow: 'Solutions',
    heading: 'Centred heroes carry no standfirst.',
    subheading: 'This text is deliberately not rendered.',
    align: 'center',
  },
}

/** Headline alone — no eyebrow, no standfirst. The band must not collapse. */
export const HeadingOnly: Story = {
  args: { heading: 'Just the headline.' },
}
