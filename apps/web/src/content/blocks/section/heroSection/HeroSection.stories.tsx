import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { HeroSection } from './HeroSection'

/**
 * The first section-block story, and the pattern the wireframe build-out
 * follows (#20, #23): a story per state the prototype shows.
 *
 * Every story here is also a test — the `stories` layer mounts each one in
 * real Chromium and axe-scans it (ADR 0004), so a block with stories needs no
 * separate test file. Props are typed through `SectionProps<'heroSection'>` via
 * the component, so a schema change that alters the block's shape breaks this
 * file at compile time.
 */
const meta = {
  title: 'Content/Blocks/Section/HeroSection',
  component: HeroSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeroSection>

export default meta
type Story = StoryObj<typeof meta>

/** The homepage treatment: multi-line headline, last line muted. */
export const Default: Story = {
  args: {
    headlineLines: ['We build digital', 'products that', 'earn their keep'],
    subheading: 'Strategy, design, and engineering for teams shipping real work.',
    cta: { _type: 'cta', label: 'See the work', variant: 'brand', href: '/work', target: null },
    surface: 'ink',
  },
  globals: { backgrounds: { value: 'ink' } },
}

/** A single headline line gets no muting — the treatment needs two or more. */
export const SingleLine: Story = {
  args: {
    headlineLines: ['One line only'],
    subheading: undefined,
    cta: null,
    surface: 'ink',
  },
  globals: { backgrounds: { value: 'ink' } },
}

/** Headline alone: no subheading, no cta. The layout must not collapse. */
export const HeadlineOnly: Story = {
  args: {
    headlineLines: ['Just the headline', 'and nothing else'],
    subheading: undefined,
    cta: null,
    surface: 'ink',
  },
  globals: { backgrounds: { value: 'ink' } },
}

/** The light-surface variant, for pages that open on bone rather than ink. */
export const BoneSurface: Story = {
  args: {
    headlineLines: ['A lighter opening', 'for interior pages'],
    subheading: 'The same block, on the bone surface.',
    cta: {
      _type: 'cta',
      label: 'Read more',
      variant: 'brand',
      href: '/perspectives',
      target: null,
    },
    surface: 'bone',
  },
  globals: { backgrounds: { value: 'bone' } },
}
