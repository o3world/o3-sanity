import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { HeroSection } from './HeroSection'

/**
 * The first section-block story, and the pattern the wireframe build-out
 * follows (#20, #23): a story per state the frame shows.
 *
 * Every story here is also a test — the `stories` layer mounts each one in
 * real Chromium and axe-scans it (ADR 0004), so a block with stories needs no
 * separate test file. Props are typed through `SectionProps<'heroSection'>` via
 * the component, so a schema change that alters the block's shape breaks this
 * file at compile time.
 *
 * There is **no bone-surface story**. Since #42 the hero always paints its own
 * ink band under the orbital field (`1810:1616`), so `surface` never reaches
 * it — a light hero would be a different block, not this one on a light
 * surface.
 */
const meta = {
  title: 'Content/Blocks/Section/HeroSection',
  component: HeroSection,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeroSection>

export default meta
type Story = StoryObj<typeof meta>

/** The homepage treatment: two-line headline, the closing line set back. */
export const Default: Story = {
  args: {
    headlineLines: ['You see the problem in front of you.', 'We’re working on the one behind it.'],
    subheading:
      'Strategy, design, engineering and AI under one roof. The same senior team that finds the move is the team that builds it.',
    cta: { _type: 'cta', label: 'View our work', variant: 'light', href: '/work', target: null },
    decoration: 'orbs',
    surface: 'ink',
  },
  globals: { backgrounds: { value: 'ink' } },
}

/** A single headline line gets no set-back — the treatment needs two or more. */
export const SingleLine: Story = {
  args: {
    headlineLines: ['One line only'],
    subheading: undefined,
    cta: null,
    decoration: 'orbs',
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
    decoration: 'orbs',
    surface: 'ink',
  },
  globals: { backgrounds: { value: 'ink' } },
}

/** `decoration: 'none'` drops the sphere; the dome and the band stay. */
export const NoDecoration: Story = {
  args: {
    headlineLines: ['A quieter opening', 'with no orbital field'],
    subheading: 'The same block with the decoration turned off.',
    cta: {
      _type: 'cta',
      label: 'Read more',
      variant: 'light',
      href: '/perspectives',
      target: null,
    },
    decoration: 'none',
    surface: 'ink',
  },
  globals: { backgrounds: { value: 'ink' } },
}
