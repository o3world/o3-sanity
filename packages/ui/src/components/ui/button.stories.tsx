import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { defineVariantStories } from '@o3/story-kit'

import { Button } from './button'

const kit = defineVariantStories({
  component: Button,
  title: 'UI/Button',
  knobs: {
    variant: ['brand', 'inverse', 'ghost'],
    size: ['sm', 'default', 'lg'],
  },
  defaultArgs: { children: 'View our work', arrow: true },
  matrix: ['variant', 'size'],
})

const meta: Meta<typeof Button> = { ...kit.meta, component: Button }
export default meta
type Story = StoryObj<typeof meta>

export const Playground = kit.Playground as Story
export const Matrix = kit.Matrix as Story

/** The nav "Let's talk" CTA: brand red fill, default size, trailing arrow. */
export const Brand: Story = {
  args: { children: "Let's talk", arrow: true },
}

/** The hero CTA shape — white fill on a dark band. */
export const Inverse: Story = {
  args: { variant: 'inverse', size: 'lg', children: 'View our work', arrow: true },
  globals: { backgrounds: { value: 'ink' } },
}

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
}

export const NoArrow: Story = {
  args: { children: 'Submit', arrow: false },
}

export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
}
