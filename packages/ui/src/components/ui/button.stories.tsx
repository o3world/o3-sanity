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

/** `#D6D3CC` under a `#76746F` label (`2134:1810`). */
export const Disabled: Story = {
  args: { children: 'Disabled', disabled: true },
}

/**
 * The states the `Button` set draws, on both themes it draws them for.
 *
 * Hover, focus and press are PAINTED here rather than triggered: a screenshot
 * cannot hold a pseudo-class, so each cell names the same token its variant in
 * `SET_STATES` names, and this story is where the two are held together by eye.
 * `disabled` needs no such help and is the attribute.
 *
 * The `light` column is a real ink band, so it is also where a state token that
 * inverts on dark shows itself: that is what `btn-disabled-fg` exists for.
 */
export const States: Story = {
  render: () => {
    const painted = [
      ['Default', ''],
      ['Hover', 'bg-brand text-white'],
      ['Focus', 'bg-btn-focus text-white'],
      ['Press', 'bg-btn-press text-ink'],
    ] as const

    return (
      <div className="bg-line grid gap-px md:grid-cols-2">
        {(['dark', 'light'] as const).map((variant) => (
          <div
            key={variant}
            data-surface={variant === 'light' ? 'ink' : 'white'}
            className={`flex flex-col items-start gap-6 p-10 ${variant === 'light' ? 'bg-ink' : 'bg-white'}`}
          >
            {painted.map(([state, paint]) => (
              <div key={state} className="flex flex-col items-start gap-2">
                <span className="eyebrow text-fg-muted">
                  {variant} · {state}
                </span>
                <Button variant={variant} className={paint} icon={<ArrowIcon />}>
                  View our work
                </Button>
              </div>
            ))}
            <div className="flex flex-col items-start gap-2">
              <span className="eyebrow text-fg-muted">{variant} · Disabled</span>
              <Button variant={variant} disabled icon={<ArrowIcon />}>
                View our work
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  },
}
