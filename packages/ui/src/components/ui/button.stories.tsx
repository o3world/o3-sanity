import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'

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
    variant: ['dark', 'light', 'brand', 'subtle', 'ghost'],
    appearance: ['primary', 'secondary'],
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
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await expect(getComputedStyle(button).backgroundColor).toBe('rgb(10, 10, 11)')
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await waitFor(() => expect(getComputedStyle(button).boxShadow).toContain('rgb(214, 211, 204)'))
  },
}

/** `Theme=White` (2205:1298) on ink — the CTA band's button (2336:4351). */
export const Light: Story = {
  args: { variant: 'light', children: 'View our work', icon: <ArrowIcon /> },
  globals: { backgrounds: { value: 'ink' } },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button')
    await expect(getComputedStyle(button).backgroundColor).toBe('rgb(255, 255, 255)')
    await userEvent.tab()
    await expect(button).toHaveFocus()
    await waitFor(() => expect(getComputedStyle(button).boxShadow).toContain('rgb(170, 166, 158)'))
  },
}

/**
 * A LABEL WIDER THAN THE SPACE IT WAS GIVEN (#181). The set draws none this
 * long, so nothing here is transcribed — the case is authored: `/1682-conference-ai-innovation`
 * asks for "Attend the 1682 conference on October 8", which at 390px is wider
 * than the viewport. It used to take the band and the document sideways with
 * it; now it wraps inside a 320px column and the icon holds the last position.
 */
export const LongLabel: Story = {
  args: { children: 'Attend the 1682 conference on October 8', icon: <ArrowIcon /> },
  decorators: [
    (Story) => (
      <div className="outline-current/20 w-[320px] outline outline-dashed outline-1">
        <Story />
      </div>
    ),
  ],
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

/** Real pseudo-classes keep this gallery aligned with the component's state rules. */
export const States: Story = {
  render: () => (
    <div className="grid gap-8 md:grid-cols-2">
      {(['dark', 'light', 'brand', 'subtle'] as const).map((variant) => (
        <div
          key={variant}
          className={
            variant === 'light'
              ? 'bg-ink flex flex-col items-start gap-6 p-8'
              : 'bg-bone flex flex-col items-start gap-6 p-8'
          }
        >
          <Button variant={variant} icon={<ArrowIcon />}>
            View our work
          </Button>
          {variant !== 'subtle' && (
            <Button variant={variant} appearance="secondary" icon={<ArrowIcon />}>
              View our work
            </Button>
          )}
          <Button variant={variant} disabled icon={<ArrowIcon />}>
            Disabled
          </Button>
        </div>
      ))}
    </div>
  ),
}
