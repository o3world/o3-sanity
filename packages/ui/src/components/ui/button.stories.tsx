import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { defineVariantStories } from '@o3/story-kit'

import { Button } from './button'

const kit = defineVariantStories({
  component: Button,
  title: 'UI/Button',
  knobs: {
    variant: ['dark', 'light', 'ghost'],
    size: ['base', 'large'],
  },
  defaultArgs: { children: 'View our work', arrow: true },
  matrix: ['variant', 'size'],
})

const meta: Meta<typeof Button> = { ...kit.meta, component: Button }
export default meta
type Story = StoryObj<typeof meta>

export const Playground = kit.Playground as Story
export const Matrix = kit.Matrix as Story

/** `Button / Solid`, Size=Large, on a light band — the partners CTA (1864:2405). */
export const Dark: Story = {
  args: { size: 'large', children: 'See all partners', arrow: true },
}

/** `Button / Solid`, Size=Base, on ink — the hero CTA (1868:3262). */
export const Light: Story = {
  args: { variant: 'light', children: 'View our work', arrow: true },
  globals: { backgrounds: { value: 'ink' } },
}

/** `Button / Ghost` (264:260). */
export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost' },
}

export const NoArrow: Story = {
  args: { children: 'Submit', arrow: false },
}

export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
}
