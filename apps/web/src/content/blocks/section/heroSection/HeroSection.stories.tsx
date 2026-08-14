import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { heroSectionKnobs } from '@o3/sanity/knobs'
import { defineKnobStories } from '@o3/story-kit'

import type { SectionProps } from '@/content/blocks/sectionTypes'

import { HeroSection } from './HeroSection'

/**
 * The hero's stories, half of them derived (#106).
 *
 * `Playground` and `Matrix` come out of `heroSectionKnobs` — the same
 * declaration the Sanity fields and the canvas toolbar read (ADR 0020). Adding
 * a knob to that file adds a control here and an axis to the matrix; nobody
 * edits this file to make that happen, and a knob the form gates cannot be set
 * from a control the form would have hidden.
 *
 * The stories below them are the other half, and they stay hand-written on
 * purpose: one headline line, no subheading, no CTA are facts about the
 * *content*, not about the block's design options, so there is no declaration
 * to derive them from.
 *
 * Every story here is also a test — the `stories` layer mounts each one in
 * real Chromium and axe-scans it (ADR 0004), so a block with stories needs no
 * separate test file. The fixture is typed as `SectionProps<'heroSection'>`
 * through `defineKnobStories`, so a schema change that alters the block's shape
 * still breaks this file at compile time.
 *
 * There is **no bone-surface story**. Since #42 the hero always paints its own
 * ink band under the orbital field (`1810:1616`), so `surface` never reaches
 * it — a light hero would be a different block, not this one on a light
 * surface. The `surface` knob is still offered in the Playground, because the
 * block declares it and this file does not get to disagree.
 */
const fixture: SectionProps<'heroSection'> = {
  variant: 'orbital',
  eyebrow: 'WORK',
  headlineLines: ['You see the problem in front of you.', 'We’re working on the one behind it.'],
  subheading:
    'Strategy, design, engineering and AI under one roof. The same senior team that finds the move is the team that builds it.',
  cta: { _type: 'cta', label: 'View our work', variant: 'light', href: '/work', target: null },
  decoration: 'orbs',
  surface: 'ink',
}

const kit = defineKnobStories({
  spec: heroSectionKnobs,
  component: HeroSection,
  fixture,
  // Every story in this file is an ink band, so the surface is pinned once on
  // the meta rather than repeated on each story.
  globals: { backgrounds: { value: 'ink' } },
})

// Re-typed against the component, and the two derived stories re-cast to
// match. The annotations are not decoration: an exported const whose type is
// inferred through a workspace package cannot name Storybook's internal CSF
// types across pnpm's nested copies (TS2742). Same shape as
// `packages/ui/.../button.stories.tsx`.
const meta: Meta<typeof HeroSection> = { ...kit.meta, component: HeroSection }
export default meta
type Story = StoryObj<typeof meta>

/** Every knob the hero declares, as a control. Turn one, the block redraws. */
export const Playground = kit.Playground as Story

/** Composition against decoration — the block's first two knobs, gridded. */
export const Matrix = kit.Matrix as Story

/** A single headline line gets no set-back — the treatment needs two or more. */
export const SingleLine: Story = {
  args: { ...fixture, headlineLines: ['One line only'], subheading: undefined, cta: null },
}

/** Headline alone: no subheading, no cta. The layout must not collapse. */
export const HeadlineOnly: Story = {
  args: {
    ...fixture,
    headlineLines: ['Just the headline', 'and nothing else'],
    subheading: undefined,
    cta: null,
  },
}
