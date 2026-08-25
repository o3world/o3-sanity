import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { heroSectionKnobs } from '@o3/sanity/knobs'
import { defineKnobStories } from '@o3/story-kit'
import { BrandLogo } from '@o3/ui'

import type { SectionProps } from '@o3/content-runtime/blocks'

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
 * There is **no bone-surface story**, and no control to draw one with. The
 * hero's `surface` knob offers ink and white, gated to the band composition:
 * the orbital opener paints its own ink under the sphere field (`1810:1616`),
 * and no instance of the `Interior Hero` set draws bone.
 */
const fixture: SectionProps<'heroSection'> & { brandMark: ReactNode } = {
  // The mark reaches the hero from the app's binding, not from Sanity (#228),
  // so a story stands in for one. This is what `apps/web` binds — the red tile
  // the partner lockup's `2479:2205` draws.
  brandMark: <BrandLogo color="red" size={71} />,
  variant: 'orbital',
  eyebrow: 'WORK',
  headlineLines: ['You see the problem in front of you.', 'We’re working on the one behind it.'],
  subheading:
    'Strategy, design, engineering and AI under one roof. The same senior team that finds the move is the team that builds it.',
  // No contrast, so the white fill in the story is Auto reading the band's
  // own ink — the hero forces nothing any more (#147).
  button: {
    _type: 'button',
    label: 'View our work',
    href: '/work',
    target: null,
  },
  decoration: 'orbs',
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
// The title is spelled out rather than left to `kit.meta`'s spread. Storybook's
// indexer reads this file statically, so a title arriving through a spread is
// invisible to it and the sidebar entry — and the story id every screenshot is
// keyed by — falls back to the file's path instead. Every sibling block spells
// it out for the same reason; the string is what `titleForSpec` produces.
const meta: Meta<typeof HeroSection> = {
  ...kit.meta,
  title: 'Content/Blocks/Section/HeroSection',
  component: HeroSection,
}
export default meta
type Story = StoryObj<typeof meta>

/** Every knob the hero declares, as a control. Turn one, the block redraws. */
export const Playground = kit.Playground as Story

/**
 * Composition against alignment — the block's first two knobs, gridded. The
 * orbital opener collapses to one cell: it is centred by its own composition
 * and the gate hides the axis.
 */
export const Matrix = kit.Matrix as Story

/** A single headline line gets no set-back — the treatment needs two or more. */
export const SingleLine: Story = {
  args: { ...fixture, headlineLines: ['One line only'], subheading: undefined, button: null },
}

/** Headline alone: no subheading, no button. The layout must not collapse. */
export const HeadlineOnly: Story = {
  args: {
    ...fixture,
    headlineLines: ['Just the headline', 'and nothing else'],
    subheading: undefined,
    button: null,
  },
}
