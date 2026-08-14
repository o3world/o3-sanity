import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { ThinkingOrb } from './thinking-orb'

/**
 * `thinking-orbs` (MIT, orbs.jakubantalik.com), wrapped for O3.
 *
 * Nine hand-tuned canvas animations at two presets. The presets are separate
 * drawings rather than one scaled one — each carries its own dot count, dot
 * size and speed — which is why `size` is an enum of 64 and 20 and not a
 * diameter.
 *
 * The canvas paints in an effect, so the wrapper is `'use client'` and the
 * library pauses it offscreen and for `prefers-reduced-motion`.
 */
const meta = {
  title: 'UI/ThinkingOrb',
  component: ThinkingOrb,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ThinkingOrb>

export default meta
type Story = StoryObj<typeof meta>

const STATES = [
  'working',
  'searching',
  'solving',
  'listening',
  'connecting',
  'weaving',
  'composing',
  'breathing',
  'shaping',
] as const

/** The default: `working`, at the 64px preset. */
export const Default: Story = {
  args: { state: 'working' },
}

/** All nine, so a change to one is visible against the other eight. */
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      {STATES.map((state) => (
        <figure key={state} className="flex flex-col items-center gap-2">
          <ThinkingOrb state={state} theme="light" />
          <figcaption className="text-sm">{state}</figcaption>
        </figure>
      ))}
    </div>
  ),
}

/**
 * `fill` — the same 64px tuning painted at the box's size, beside the preset
 * it came from. Compare the dots: the large one is drawn at 138, not stretched
 * from 64, so nothing is soft.
 */
export const Fill: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <ThinkingOrb state="weaving" theme="light" fill className="aspect-square w-[138px]" />
      <ThinkingOrb state="weaving" theme="light" />
    </div>
  ),
}

/** The 20px preset — the inline-status drawing, beside its 64px sibling. */
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <ThinkingOrb state="connecting" size={64} theme="light" />
      <ThinkingOrb state="connecting" size={20} theme="light" />
    </div>
  ),
}

/** Half pace. `speed` multiplies the animation's baked tempo. */
export const Slow: Story = {
  args: { state: 'weaving', speed: 0.5, theme: 'light' },
}

/** Held on a frame — what `paused` gives an editor who wants a still mark. */
export const Paused: Story = {
  args: { state: 'shaping', paused: true, theme: 'light' },
}

/**
 * On ink. `theme` is pinned rather than left on `auto` because `auto` reads
 * the document, and an ink band is a section of an otherwise light page.
 */
export const OnInk: Story = {
  args: { state: 'searching', theme: 'dark' },
  globals: { backgrounds: { value: 'ink' } },
  render: (args) => (
    <div className="bg-ink p-12">
      <ThinkingOrb {...args} />
    </div>
  ),
}
