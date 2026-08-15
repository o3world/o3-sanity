import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { defineVariantStories } from '@o3/story-kit'

import { ArrowIcon } from '../arrow-icon'
import { ChevronDownIcon, ExternalLinkIcon } from '../button-icons'
import { Button } from './button'

/**
 * **The icon slot is filled by the parent**, and these stories are a parent.
 * The button places the glyph and colours it; which glyph it is comes from
 * outside — from an editor's choice by the time a page renders it.
 */
const kit = defineVariantStories({
  component: Button,
  title: 'UI/Button',
  knobs: {
    variant: ['dark', 'light', 'ghost'],
    size: ['base', 'large'],
  },
  defaultArgs: { children: 'View our work', icon: <ArrowIcon /> },
  matrix: ['variant', 'size'],
})

const meta: Meta<typeof Button> = { ...kit.meta, component: Button }
export default meta
type Story = StoryObj<typeof meta>

export const Playground = kit.Playground as Story
export const Matrix = kit.Matrix as Story

/** `Theme=Black` (2134:1786) on a light band, at the repo's `large` step. */
export const Dark: Story = {
  args: { size: 'large', children: 'See all partners', icon: <ArrowIcon /> },
}

/** `Theme=White` (2205:1298) on ink — the CTA band's button (2336:4351). */
export const Light: Story = {
  args: { variant: 'light', children: 'View our work', icon: <ArrowIcon /> },
  globals: { backgrounds: { value: 'ink' } },
}

/** `Button / Ghost` (264:260). */
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
}

/** The slot left empty — the label alone, and the 12px gap goes with it. */
export const NoIcon: Story = {
  args: { children: 'Submit', icon: undefined },
}

/**
 * The other two glyphs of the curated set, in the same slot. Each one inherits
 * the label's colour, which is why a fill needs no icon of its own.
 */
export const ExternalIcon: Story = {
  args: { children: 'Visit O3XO', icon: <ExternalLinkIcon /> },
}

export const DownIcon: Story = {
  args: { children: 'How we work', icon: <ChevronDownIcon /> },
}

export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
}
